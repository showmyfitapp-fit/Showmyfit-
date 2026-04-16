import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { StaticImageData } from 'next/image';

interface BannerSlide {
  id: number;
  image: string | StaticImageData;
  title: string;
  subtitle: string;
  description: string;
  ctaLink: string;
}

const SlidingBanner: React.FC = () => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(1); // Start at 1 because we duplicate first slide
  const [isTransitioning, setIsTransitioning] = useState(true);

  const slides: BannerSlide[] = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600&h=800&fit=crop&crop=center',
      title: 'Summer Collection',
      subtitle: 'FRESH ARRIVALS',
      description: 'Discover the hottest trends for the season with our new premium collection.',
      ctaLink: '/browse?category=Summer'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=800&fit=crop&crop=center',
      title: 'Urban Elegance',
      subtitle: 'TRENDING NOW',
      description: 'Elevate your everyday style with our curated selection of urban essentials.',
      ctaLink: '/browse?category=Fashion'
    }
  ];

  // Create infinite loop by duplicating first and last slides
  const infiniteSlides = [
    slides[slides.length - 1], // Last slide at the beginning
    ...slides,                   // Original slides
    slides[0]                   // First slide at the end
  ];

  // Auto-slide functionality with seamless loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => {
        const nextSlide = prevSlide + 1;

        // If we've reached the duplicate last slide, the useEffect will handle the jump
        if (nextSlide >= infiniteSlides.length - 1) {
          return infiniteSlides.length - 1;
        }

        return nextSlide;
      });
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [infiniteSlides.length]);

  // Handle seamless loop transition
  useEffect(() => {
    if (currentSlide === infiniteSlides.length - 1) {
      // When we reach the duplicate last slide, instantly jump to real first slide
      const timer = setTimeout(() => {
        setIsTransitioning(false); // Disable transition for instant jump
        setCurrentSlide(1);
        setTimeout(() => setIsTransitioning(true), 50); // Re-enable after jump
      }, 500); // Wait for transition to complete
      return () => clearInterval(timer);
    }

    if (currentSlide === 0) {
      // When we reach the duplicate first slide (going backwards), jump to real last slide
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(slides.length);
        setTimeout(() => setIsTransitioning(true), 50);
      }, 500);
      return () => clearInterval(timer);
    }
  }, [currentSlide, infiniteSlides.length, slides.length]);

  const goToNext = () => {
    setCurrentSlide((prev) => prev + 1);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => prev - 1);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex + 1); // +1 because of duplicate first slide
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden group">
      {/* Slide Container */}
      <div
        className={`flex h-full ${isTransitioning ? 'transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)' : ''}`}
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {infiniteSlides.map((slide, index) => (
          <div key={`slide-${index}`} className="w-full h-full flex-shrink-0 relative">
            {/* Background Image */}
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-100 transition-transform duration-[10s] hover:scale-105"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* Overlay - Modern Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent opacity-90"></div>

              {/* Content */}
              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-center px-4 md:px-16 lg:px-24">
                <div className="max-w-4xl text-center animate-fade-in-up flex flex-col items-center">
                  {/* Subtitle Removed */}
                  <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight drop-shadow-2xl tracking-tight">
                    {slide.title}
                  </h2>
                  <p className="text-lg md:text-2xl text-white/90 mb-10 font-medium leading-relaxed max-w-2xl mx-auto drop-shadow-md">
                    {slide.description}
                  </p>

                  <button
                    onClick={() => router.push(slide.ctaLink)}
                    className="group relative inline-flex items-center gap-3 px-10 py-4 bg-white text-black text-base md:text-lg font-black tracking-widest transition-all duration-300 hover:bg-black hover:text-white hover:scale-105 active:scale-95 rounded-full shadow-2xl"
                  >
                    <span className="relative z-10">SHOP NOW</span>
                    <ArrowRight className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows Removed */}

      {/* Slide Indicators Removed */}
    </div>
  );
};

export default SlidingBanner;
