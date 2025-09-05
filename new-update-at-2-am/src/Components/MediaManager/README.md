# Media Manager with Custom Cloudinary Uploader

This Media Manager component provides a full-featured media library with a custom direct Cloudinary upload implementation.

## Features

- Upload files directly to Cloudinary without requiring an external component
- Automatic file uploads as soon as files are selected
- Drag and drop file upload functionality
- Real-time progress tracking for uploads
- Support for images, videos, and documents
- File preview before and after upload
- Folder management for organizing media
- Streamlined two-step workflow: Upload → Set Metadata

## Setup

1. Create a `.env` file in your project root based on the `.env.example` file
2. Set your Cloudinary configuration:

```
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

3. If you don't have a preset, create one in your Cloudinary console (Settings > Upload > Upload presets)

## How the Upload Flow Works

The new upload flow streamlines the process:

1. User selects files via drag-and-drop or file browser
2. Files start uploading automatically to Cloudinary with progress indicators
3. Once uploads complete, the system automatically shows the metadata tab
4. User sets folder, tags, and other metadata for the uploads
5. User clicks "Save to Library" to save all uploaded files with metadata

This two-step approach makes the process clearer and more efficient.

## Usage

### FileUploader Component

The `FileUploader` component can be used standalone:

```jsx
import { FileUploader } from '../Components/MediaManager';

const MyComponent = () => {
  const handleUpload = (url, type) => {
    console.log(`Uploaded file: ${url}, type: ${type}`);
  };
  
  const handleRemove = (index) => {
    console.log(`Removed file at index: ${index}`);
  };
  
  return (
    <FileUploader
      onUpload={handleUpload}
      onRemove={handleRemove}
      initialImages={[]} // Optional initial images
      disabled={false} // Optional disabled state
    />
  );
};
```

### Full Media Manager

The full Media Manager component provides a complete media library experience:

```jsx
import { MediaManager } from '../Components/MediaManager';

const MyComponent = () => {
  return (
    <MediaManager />
  );
};
```

### Media Selector

For selecting media from the library:

```jsx
import { MediaSelector } from '../Components/MediaManager';

const MyComponent = () => {
  const [selectedMedia, setSelectedMedia] = useState([]);
  
  const handleSelect = (media) => {
    setSelectedMedia([...selectedMedia, media.url]);
  };
  
  const handleRemove = (index) => {
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
  };
  
  return (
    <MediaSelector
      selectedMedia={selectedMedia}
      onSelect={handleSelect}
      onRemove={handleRemove}
    />
  );
};
``` 