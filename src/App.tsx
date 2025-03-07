import React, { useState } from 'react';
import { Brain, Settings as Lungs, Activity, ArrowLeft, Loader2, Heart, Clock, Users } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import axios from 'axios';

type SegmentationType = 'brain' | 'lung' | null;

function App() {
  const [selectedType, setSelectedType] = useState<SegmentationType>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [segmentedImage, setSegmentedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsProcessing(true);
    setUploadedImage(URL.createObjectURL(file));
    setError(null);

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/segment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
    });

      const imageBlob = new Blob([response.data], { type: 'image/png' });
      const imageUrl = URL.createObjectURL(imageBlob);

      setSegmentedImage(imageUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process the image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setSelectedType(null);
    setUploadedImage(null);
    setSegmentedImage(null);
    setIsProcessing(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[var(--medical-green-50)]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-[var(--medical-green-200)]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <Activity className="h-8 w-8 text-[var(--medical-green-600)]" />
                <div className="absolute inset-0 bg-[var(--medical-green-400)] rounded-full pulse-ring"></div>
              </div>
              <h1 className="ml-3 text-2xl font-semibold text-[var(--medical-green-700)]">
                Medical Image Segmentation
              </h1>
            </div>
            {selectedType && (
              <button
                onClick={resetState}
                className="flex items-center px-4 py-2 text-sm font-medium text-[var(--medical-green-600)] hover:text-[var(--medical-green-700)] transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to selection
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!selectedType && (
          <div className="medical-stats">
            <div className="medical-stat-item">
              <Heart className="h-6 w-6 text-[var(--medical-green-500)] mb-2" />
              <span className="text-sm text-gray-600">Accuracy Rate</span>
              <span className="text-xl font-bold text-[var(--medical-green-700)]">98.5%</span>
            </div>
            <div className="medical-stat-item">
              <Clock className="h-6 w-6 text-[var(--medical-green-500)] mb-2" />
              <span className="text-sm text-gray-600">Processing Time</span>
              <span className="text-xl font-bold text-[var(--medical-green-700)]">&lt; 2s</span>
            </div>
            <div className="medical-stat-item">
              <Users className="h-6 w-6 text-[var(--medical-green-500)] mb-2" />
              <span className="text-sm text-gray-600">Cases Analyzed</span>
              <span className="text-xl font-bold text-[var(--medical-green-700)]">10,000+</span>
            </div>
          </div>
        )}

        {!selectedType ? (
          <>
            <h2 className="text-2xl font-bold text-[var(--medical-green-700)] mb-6 text-center">
              Select Segmentation Type
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <button
                onClick={() => setSelectedType('brain')}
                className="group relative flex flex-col items-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-[var(--medical-green-400)]"
              >
                <div className="absolute inset-0 bg-[var(--medical-green-100)] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <Brain className="h-20 w-20 text-[var(--medical-green-500)] mb-6 relative z-10" />
                <h2 className="text-2xl font-semibold text-[var(--medical-green-700)] mb-3 relative z-10">
                  Brain Tumor Segmentation
                </h2>
                <p className="text-gray-600 text-center relative z-10">
                  Advanced MRI analysis for precise tumor detection and boundary mapping
                </p>
              </button>

              <button
                onClick={() => setSelectedType('lung')}
                className="group relative flex flex-col items-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-[var(--medical-green-400)]"
              >
                <div className="absolute inset-0 bg-[var(--medical-green-100)] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <Lungs className="h-20 w-20 text-[var(--medical-green-500)] mb-6 relative z-10" />
                <h2 className="text-2xl font-semibold text-[var(--medical-green-700)] mb-3 relative z-10">
                  Lung Tumor Segmentation
                </h2>
                <p className="text-gray-600 text-center relative z-10">
                  State-of-the-art CT scan analysis for accurate pulmonary tumor identification
                </p>
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-[var(--medical-green-200)]">
            <h2 className="text-2xl font-bold text-[var(--medical-green-700)] mb-6">
              {selectedType === 'brain' ? 'Brain' : 'Lung'} Tumor Segmentation
            </h2>

            {!uploadedImage ? (
              <ImageUploader onUpload={handleImageUpload} />
            ) : (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--medical-green-700)]">Original Scan</h3>
                    <div className="relative aspect-square bg-[var(--medical-green-50)] rounded-lg overflow-hidden border border-[var(--medical-green-200)]">
                      <img
                        src={uploadedImage}
                        alt="Original scan"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--medical-green-700)]">Segmentation Result</h3>
                    <div className="relative aspect-square bg-[var(--medical-green-50)] rounded-lg overflow-hidden border border-[var(--medical-green-200)]">
                      {isProcessing ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 text-[var(--medical-green-500)] animate-spin mx-auto mb-2" />
                            <p className="text-sm text-[var(--medical-green-600)]">Processing scan...</p>
                          </div>
                        </div>
                      ) : segmentedImage && (
                        <img
                          id="output"
                          src={segmentedImage}
                          alt="Segmented result"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="text-red-500 text-center mt-4">
                    {error}
                  </div>
                )}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setSegmentedImage(null);
                    }}
                    className="px-6 py-3 bg-[var(--medical-green-500)] text-white rounded-lg hover:bg-[var(--medical-green-600)] transition-colors"
                  >
                    Upload New Scan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;