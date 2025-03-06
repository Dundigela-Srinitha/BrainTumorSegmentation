import sys
import numpy as np
import tensorflow as tf
import cv2
from PIL import Image
from keras.saving import register_keras_serializable
from patchify import patchify

# Register the custom loss function
@register_keras_serializable()
def dice_loss(y_true, y_pred):
    smooth = 1.0
    y_true_f = tf.keras.backend.flatten(y_true)
    y_pred_f = tf.keras.backend.flatten(y_pred)
    intersection = tf.keras.backend.sum(y_true_f * y_pred_f)
    return 1 - (2.0 * intersection + smooth) / (tf.keras.backend.sum(y_true_f) + tf.keras.backend.sum(y_pred_f) + smooth)

# Register the custom metric function
@register_keras_serializable()
def dice_coef(y_true, y_pred):
    smooth = 1.0
    y_true_f = tf.keras.backend.flatten(y_true)
    y_pred_f = tf.keras.backend.flatten(y_pred)
    intersection = tf.keras.backend.sum(y_true_f * y_pred_f)
    return (2.0 * intersection + smooth) / (tf.keras.backend.sum(y_true_f) + tf.keras.backend.sum(y_pred_f) + smooth)

# Load the model
MODEL_PATH = "model.keras"
try:
    print("Loading model...")
    model = tf.keras.models.load_model(MODEL_PATH, custom_objects={'dice_loss': dice_loss, 'dice_coef': dice_coef})
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    sys.exit(1)

# Configuration
cf = {
    "image_size": 256,
    "num_channels": 3,
    "patch_size": 16,
    "num_patches": (256**2) // (16**2),
    "flat_patches_shape": ((256**2) // (16**2), 16 * 16 * 3)
}

def preprocess_image(image):
    print("Preprocessing image...")
    # Resize the image to the expected input shape (256, 256)
    image = cv2.resize(image, (cf["image_size"], cf["image_size"]))
    # Normalize the image
    image = image / 255.0
    return image

def patchify_image(image):
    print("Patchifying image...")
    patch_shape = (cf["patch_size"], cf["patch_size"], cf["num_channels"])
    patches = patchify(image, patch_shape, cf["patch_size"])
    patches = np.reshape(patches, cf["flat_patches_shape"])
    patches = patches.astype(np.float32)
    patches = np.expand_dims(patches, axis=0)
    return patches

def segment_image(input_path, output_path):
    try:
        print(f"Reading image from: {input_path}")
        image = cv2.imread(input_path, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Could not read the image file.")

        # Preprocess the image
        processed_image = preprocess_image(image)

        # Patchify the image
        patches = patchify_image(processed_image)

        print("Predicting segmentation mask...")
        prediction = model.predict(patches, verbose=0)[0]

        # Reshape the prediction to match the original image size
        prediction = np.reshape(prediction, (cf["image_size"], cf["image_size"]))
        prediction = (prediction > 0.5).astype(np.uint8)  # Threshold and convert to uint8

        # Resize the prediction to match the original input image size
        original_height, original_width = image.shape[:2]
        prediction_resized = cv2.resize(prediction, (original_width, original_height))

        # Create a red mask
        red_mask = np.zeros_like(image)
        red_mask[prediction_resized == 1] = [0, 0, 255]  # Set mask region to red (BGR format)

        # Merge the input image with the red mask
        merged_image = cv2.addWeighted(image, 0.7, red_mask, 0.3, 0)

        print("Saving output image...")
        cv2.imwrite(output_path, merged_image)

        print("Segmentation completed successfully.")
    except Exception as e:
        print(f"Error during segmentation: {e}")
        raise

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 segment.py <input_path> <output_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    try:
        segment_image(input_path, output_path)
    except Exception as e:
        print(f"Segmentation failed: {e}")
        sys.exit(1)