from flask import Flask, request, send_file, jsonify
import cv2
import numpy as np
import tensorflow as tf
from io import BytesIO
import os
from keras.saving import register_keras_serializable
from patchify import patchify
from flask_cors import CORS
# Suppress TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress INFO and WARNING logs
tf.get_logger().setLevel('ERROR')  # Suppress TensorFlow internal logs


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register custom loss and metric functions
@register_keras_serializable()
def dice_loss(y_true, y_pred):
    smooth = 1.0
    y_true_f = tf.keras.backend.flatten(y_true)
    y_pred_f = tf.keras.backend.flatten(y_pred)
    intersection = tf.keras.backend.sum(y_true_f * y_pred_f)
    return 1 - (2.0 * intersection + smooth) / (tf.keras.backend.sum(y_true_f) + tf.keras.backend.sum(y_pred_f) + smooth)

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
    exit(1)

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

@app.route('/api/segment', methods=['POST'])
def segment():
    try:
        # Check if an image file is uploaded
        if 'image' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        # Read the uploaded image file
        file = request.files['image']
        image = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)

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

        # Save the output image to a bytes buffer
        _, buffer = cv2.imencode('.png', merged_image)
        io_buf = BytesIO(buffer)

        # Return the image as a response
        return send_file(io_buf, mimetype='image/png')
    except Exception as e:
        print(f"Error during segmentation: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run Flask in production mode (disable debug mode)
    app.run(host="0.0.0.0", port=5000, debug=False)