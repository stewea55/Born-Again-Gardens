export default function ImagePlaceholder({ label }) {
  return (
    <div className="image-placeholder">
      {label ? `Image: ${label}` : "Image"}
    </div>
  );
}
