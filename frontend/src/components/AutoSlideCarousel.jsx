import React, { useEffect, useState, useRef } from "react";
import "./AutoSlideCarousel.css";

/**
 * Auto‑slide carousel for property images.
 * images: [{ url: string, alt?: string }]
 * interval: milliseconds between slides (default 4000)
 */
export default function AutoSlideCarousel({ images = [], interval = 4000 }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef(null);

  // Advance to next slide
  const nextSlide = () => {
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  // Set up / clean up timer
  useEffect(() => {
    if (images.length <= 1) return; // nothing to slide
    clearInterval(timerRef.current);
    timerRef.current = setInterval(nextSlide, interval);
    return () => clearInterval(timerRef.current);
  }, [images.length, interval]);

  if (!images.length) {
    return <div className="carousel__placeholder">No image available</div>;
  }

  return (
    <div className="carousel">
      <div className="carousel__track" style={{ transform: `translateX(-${activeIdx * 100}%)` }}>
        {images.map((img, i) => (
          <img
            key={i}
            src={img.url}
            alt={img.alt || `Property image ${i + 1}`}
            className={`carousel__slide ${i === activeIdx ? "carousel__slide--active" : ""}`}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600";
            }}
          />
        ))}
      </div>
      <div className="carousel__dots">
        {images.map((_, i) => (
          <button
            key={i}
            className={`carousel__dot ${i === activeIdx ? "carousel__dot--active" : ""}`}
            onClick={() => setActiveIdx(i)}
            aria-label={`Show image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
