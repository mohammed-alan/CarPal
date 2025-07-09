
// Import React hooks for state, references, and side-effects
import { useState, useRef, useEffect } from 'react';

// Main Dashboard component
function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);   // State for file selected via upload or drag & drop
  const [imagePreview, setImagePreview] = useState(null);   // State for previewing the selected image locally before upload
  const [uploadedImages, setUploadedImages] = useState([]);   // State to hold images fetched from backend (already uploaded)
  const [clickedImage, setClickedImage] = useState(null);   // State to hold the full-size clicked image for modal display
  const fileInputRef = useRef(null);   // Reference to the hidden file input element
  const [loading, setLoading] = useState(true);   // State to show/hide loading screen while checking authentication


  // Logs out the user by clearing JWT token and redirecting to login
  function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/';
  }

  // Effect: Check if the user has a token when the component loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/'; // Redirect if not authenticated
    } else {
      setLoading(false); // Done loading, user is authenticated
    }
  }, []);

  // Effect: Fetch uploaded images from backend on initial render
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:3000/images', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json()) // Parse JSON response
      .then(data => setUploadedImages(data)) // Save to state
      .catch(err => console.error('Error loading images:', err));
  }, []);

  // Handles file drop or manual selection
  function handleFiles(files) {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) return; // Only images allowed

    setSelectedFile(file); // Save selected file
    setImagePreview(URL.createObjectURL(file)); // Create preview URL
  }

  // When user clicks "Choose Image", simulate click on hidden input
  function onButtonClick() {
    fileInputRef.current.click();
  }

  // When a file is selected manually from file input
  function onFileChange(e) {
    handleFiles(e.target.files);
  }

  // Drag & drop handlers
  function onDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function onDragOver(e) {
    e.preventDefault(); // Needed to allow drop
  }

  // Uploads the selected image and fetches updated image list
  async function onSubmit() {
    if (!selectedFile) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Not authenticated');
      window.location.href = '/';
      return;
    }

    const formData = new FormData(); // FormData for multipart image upload
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}` // Secure access
        }
      });

      if (response.ok) {
        alert('Image uploaded successfully!');
        setSelectedFile(null); // Reset file input
        setImagePreview(null); // Clear preview

        // Re-fetch image list from backend
        const imagesResponse = await fetch('http://localhost:3000/images', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json();
          setUploadedImages(imagesData); // Update images list
        }

        const data = await response.json(); // Get image URL from server
        setClickedImage(`http://localhost:3000${data.url}`); // Open modal with new image
      } else {
        const errorText = await response.text();
        alert(`Upload failed: ${errorText}`);
      }
    } catch (error) {
      alert('Error uploading image');
      console.error(error);
    }
  }

  // Deletes an image from the server and state
  async function handleDelete(imageId) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3000/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const text = await response.text();
      if (response.ok) {
        alert('Image deleted');
        setClickedImage(null); // Close modal
        setUploadedImages(prev => prev.filter(img => img.id !== imageId)); // Remove from state
      } else {
        console.log(`Failed to delete image: ${text}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting image');
    }
  }

  // Show nothing while loading
  if (loading) return null;

  // Component for displaying a label-value pair in info modal
  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between border-b border-gray-700 py-2">
      <span className="text-blue-400 font-semibold">{label}</span>
      <span className="text-gray-300">{value || 'N/A'}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-10 px-4 md:px-8">
      {/* Outer container with gradient background */}
      <div className="max-w-6xl mx-auto bg-gray-800 rounded-3xl shadow-2xl p-8">
        {/* Header: App title + logout */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-400 select-none tracking-wide drop-shadow-lg">
            CarPal Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-lg"
          >
            Logout
          </button>
        </div>

        {/* Main section: upload and gallery columns */}
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left: Upload section */}
          <div className="flex-1 bg-gray-900 rounded-2xl p-6 shadow-inner shadow-black/50">
            <h2 className="text-3xl font-semibold mb-8 text-center md:text-left text-blue-300 tracking-wide">
              Upload a Car Image
            </h2>

            {/* Upload button + file input */}
            <div className="flex flex-col items-center">
              <button
                onClick={onButtonClick}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md"
              >
                Choose Image
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={onFileChange}
              />

              {/* Drag-and-drop zone */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="w-full mt-8 border-4 border-dashed border-gray-600 rounded-xl h-48 flex items-center justify-center text-gray-400 hover:border-blue-500 transition cursor-pointer select-none text-lg font-light"
              >
                Drag & Drop Image Here
              </div>

              {/* If image selected, show preview + submit */}
              {imagePreview && (
                <div className="mt-10 w-full text-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-96 mx-auto rounded-xl shadow-xl"
                  />
                  <button
                    onClick={onSubmit}
                    className="mt-6 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow-lg font-semibold text-lg"
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Previously uploaded gallery */}
          <div className="w-full md:w-64 bg-gray-900 rounded-2xl p-4 shadow-inner shadow-black/50">
            <h2 className="text-2xl font-semibold mb-6 text-center text-blue-300 tracking-wide">
              Previously Uploaded
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-1 gap-6 overflow-y-auto max-h-[520px] pr-2 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-800">
              {uploadedImages.map((img, index) => (
                <div
                  key={img.id || index}
                  className="mb-6 rounded-xl overflow-hidden shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-[1.05]"
                  onClick={() => setClickedImage(`http://localhost:3000${img.url}`)}
                >
                  <img
                    src={`http://localhost:3000${img.url}`}
                    alt={img.filename}
                    className="w-full h-24 object-cover"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Show when an image is clicked */}
      {clickedImage && (() => {
        // Find matching image data
        const clickedImgData = uploadedImages.find(
          img => `http://localhost:3000${img.url}` === clickedImage
        );

        // Try parsing car_info JSON safely
        let info = null;
        try {
          info =
            clickedImgData &&
            (typeof clickedImgData.car_info === 'string'
              ? JSON.parse(clickedImgData.car_info)
              : clickedImgData.car_info);
        } catch {
          info = null;
        }

        return (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-6">
            {/* Top bar: Delete and Close buttons */}
            <div className="flex justify-end w-full gap-4 mb-6">
              {clickedImgData?.id && (
                <button
                  onClick={() => handleDelete(clickedImgData.id)}
                  className="text-white bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl shadow-lg font-semibold"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setClickedImage(null)}
                className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl shadow-lg font-semibold"
              >
                Close
              </button>
            </div>

            {/* Modal content: image + AI info */}
            <div className="flex flex-col md:flex-row items-center md:items-start max-w-5xl w-full gap-10 bg-gradient-to-r from-blue-900 via-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl">
              <img
                src={clickedImage}
                alt="Full preview"
                className="max-w-xs max-h-[60vh] rounded-3xl shadow-xl object-contain"
                draggable={false}
              />
              {info && (
                <div className="flex-1 bg-gray-900 bg-opacity-70 backdrop-blur-md rounded-3xl p-6 text-gray-200 shadow-inner shadow-blue-900/50 overflow-auto max-h-[60vh]">
                  <h3 className="text-3xl font-bold mb-6 text-blue-400 tracking-wide drop-shadow-md">
                    Car Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-lg">
                    <InfoRow label="Make" value={info.make} />
                    <InfoRow label="Model" value={info.model} />
                    <InfoRow label="Year" value={info.year} />
                    <InfoRow label="Body Type" value={info.body_type} />
                    <InfoRow label="Horsepower" value={info.horsepower} />
                    <InfoRow label="Top Speed (kph)" value={info.top_speed_kph} />
                    <InfoRow label="Fuel Efficiency (km/l)" value={info.fuel_efficiency_kmpl} />
                    <InfoRow
                      label="Approximate Price (USD)"
                      value={info.price_usd ? `$${info.price_usd}` : null}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Dashboard;
