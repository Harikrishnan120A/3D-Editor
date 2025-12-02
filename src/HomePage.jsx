import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Circle, 
  Cylinder, 
  Triangle, 
  Donut, 
  Square,
  Sparkles,
  Zap,
  Layers,
  Palette,
  Move,
  RotateCw,
  Maximize2,
  Star,
  ArrowRight,
  Play,
  Lightbulb,
  Eye,
  Code,
  Download,
  Users,
  Award,
  Hexagon,
  Pentagon,
  Diamond,
  Gem,
  Heart
} from 'lucide-react';

const LoadingAnimation = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentShapeIndex, setCurrentShapeIndex] = useState(0);

  const loadingShapes = [
    { Icon: Box, label: 'Loading Cubes', color: 'text-blue-400' },
    { Icon: Circle, label: 'Loading Spheres', color: 'text-purple-400' },
    { Icon: Cylinder, label: 'Loading Cylinders', color: 'text-pink-400' },
    { Icon: Hexagon, label: 'Loading Polyhedra', color: 'text-green-400' },
    { Icon: Star, label: 'Loading Stars', color: 'text-yellow-400' },
    { Icon: Gem, label: 'Loading Gems', color: 'text-cyan-400' }
  ];

  useEffect(() => {
    const duration = 3000; // 3 seconds
    const steps = 100;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete(), 300);
          return 100;
        }
        return prev + 1;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const shapeInterval = setInterval(() => {
      setCurrentShapeIndex((prev) => (prev + 1) % loadingShapes.length);
    }, 500);
    return () => clearInterval(shapeInterval);
  }, []);

  const currentShape = loadingShapes[currentShapeIndex];
  const CurrentIcon = currentShape.Icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Rotating 3D Shapes */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {loadingShapes.map((shape, index) => {
            const ShapeIcon = shape.Icon;
            const rotation = (index * 60) + (progress * 3.6);
            const scale = currentShapeIndex === index ? 1.5 : 0.8;
            const opacity = currentShapeIndex === index ? 1 : 0.3;
            
            return (
              <div
                key={index}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${shape.color}`}
                style={{
                  transform: `rotate(${rotation}deg) translateY(-60px) scale(${scale})`,
                  opacity: opacity
                }}
              >
                <ShapeIcon size={40} strokeWidth={2} />
              </div>
            );
          })}
          
          {/* Center Glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-16 h-16 rounded-full ${currentShape.color} opacity-20 blur-xl animate-pulse`}></div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold mb-4 text-white">
          <span className={`${currentShape.color} transition-colors duration-500`}>
            {currentShape.label}
          </span>
        </h2>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Percentage */}
        <p className="text-gray-400 text-lg font-semibold">{progress}%</p>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${loadingShapes[i % loadingShapes.length].color} opacity-60`}
              style={{
                left: `${10 + (i * 6)}%`,
                top: `${20 + (i * 5)}%`,
                animation: `float-particle ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ onStart }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hoveredCardRef = React.useRef(null);

  const shapes = [
    { icon: Box, color: 'text-blue-400', name: 'Cube', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Circle, color: 'text-purple-400', name: 'Sphere', gradient: 'from-purple-500 to-pink-500' },
    { icon: Cylinder, color: 'text-pink-400', name: 'Cylinder', gradient: 'from-pink-500 to-rose-500' },
    { icon: Triangle, color: 'text-green-400', name: 'Pyramid', gradient: 'from-green-500 to-emerald-500' },
    { icon: Donut, color: 'text-yellow-400', name: 'Torus', gradient: 'from-yellow-500 to-orange-500' },
    { icon: Star, color: 'text-red-400', name: 'Star', gradient: 'from-red-500 to-pink-500' }
  ];

  const features = [
    {
      icon: Layers,
      title: '75+ 3D Shapes',
      description: 'Extensive library from basic primitives to complex parametric surfaces',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Palette,
      title: 'Color Presets',
      description: '70 beautiful preset colors organized in an intuitive palette',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Move,
      title: 'Transform Tools',
      description: 'Precise translate, rotate, and scale controls with keyboard shortcuts',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Sparkles,
      title: 'Material System',
      description: 'Advanced PBR materials with metalness, roughness, and emissive',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Lightbulb,
      title: 'Dynamic Lighting',
      description: 'Multiple light types with adjustable intensity and colors',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: Eye,
      title: 'Camera Views',
      description: 'Multiple camera angles and perspective/orthographic modes',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Code,
      title: 'Export Ready',
      description: 'Export scenes as GLB/GLTF for use in other 3D applications',
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      icon: Download,
      title: 'Import Models',
      description: 'Import existing 3D models and continue editing them',
      gradient: 'from-red-500 to-orange-500'
    }
  ];

  const technologies = [
    { name: 'React 18', icon: '⚛️' },
    { name: 'Three.js', icon: '🎲' },
    { name: 'Tailwind CSS', icon: '🎨' },
    { name: 'Vite', icon: '⚡' }
  ];

  const capabilities = [
    { count: '75+', label: 'Unique Shapes', icon: Box },
    { count: '15', label: 'Categories', icon: Layers },
    { count: '70', label: 'Color Presets', icon: Palette },
    { count: '∞', label: 'Possibilities', icon: Sparkles }
  ];

  useEffect(() => {
    let rafId = null;
    let lastUpdate = 0;
    const throttleMs = 16; // ~60fps

    const handleMouseMove = (e) => {
      if (rafId) return;
      
      rafId = requestAnimationFrame(() => {
        const now = Date.now();
        if (now - lastUpdate >= throttleMs) {
          setMousePosition({
            x: (e.clientX / window.innerWidth - 0.5) * 20,
            y: (e.clientY / window.innerHeight - 0.5) * 20
          });
          setCursorPosition({ x: e.clientX, y: e.clientY });
          lastUpdate = now;
        }
        rafId = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);
    
    // Use event delegation for better performance
    const handleGlobalMouseOver = (e) => {
      if (e.target.closest('button, a')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    
    document.addEventListener('mouseover', handleGlobalMouseOver, { passive: true });
    
    return () => {
      document.removeEventListener('mouseover', handleGlobalMouseOver);
    };
  }, [isLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShape((prev) => (prev + 1) % shapes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            // Stop observing once animated to reduce overhead
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Trigger slightly before element is visible
      }
    );

    // Use setTimeout to batch DOM queries after initial render
    const timeoutId = setTimeout(() => {
      document.querySelectorAll('.observe-animation').forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isLoading]);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    let rafId = null;
    let lastUpdate = 0;
    const throttleMs = 32; // ~30fps for scroll is sufficient
    
    const handleScroll = () => {
      if (rafId) return;
      
      rafId = requestAnimationFrame(() => {
        const now = Date.now();
        if (now - lastUpdate >= throttleMs) {
          const currentScrollY = window.scrollY;
          setShowScrollTop(currentScrollY > 300);
          
          const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const scrolled = (currentScrollY / windowHeight) * 100;
          setScrollProgress(scrolled);
          
          lastUpdate = now;
        }
        rafId = null;
      });
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  };

  if (isLoading) {
    return <LoadingAnimation onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white md:cursor-none animate-fade-in overflow-x-hidden">
      {/* Custom Cursor - Hidden on Mobile - Enhanced Design */}
      <div 
        className="fixed w-12 h-12 pointer-events-none z-[9999] hidden md:block"
        style={{
          left: `${cursorPosition.x}px`,
          top: `${cursorPosition.y}px`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Outer Glow */}
        <div 
          className={`absolute inset-0 rounded-full transition-all duration-500 blur-xl ${
            isHovering 
              ? 'bg-purple-500/40 scale-150' 
              : 'bg-blue-500/30 scale-100'
          }`}
          style={{
            animation: 'pulse-glow 2s ease-in-out infinite'
          }}
        />
        
        {/* Rotating Border */}
        <div 
          className={`absolute inset-2 border-2 rounded-full transition-all duration-300 ${
            isHovering 
              ? 'border-purple-400 border-dashed scale-125' 
              : 'border-blue-400 scale-100'
          }`}
          style={{
            animation: 'spin-slow 8s linear infinite'
          }}
        />
        
        {/* Inner Ring */}
        <div 
          className={`absolute inset-3 border rounded-full transition-all duration-200 ${
            isHovering 
              ? 'border-pink-400 scale-110' 
              : 'border-cyan-400 scale-100'
          }`}
        />
        
        {/* Center Dot */}
        <div 
          className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-200 shadow-lg ${
            isHovering 
              ? 'bg-gradient-to-br from-purple-400 to-pink-500 scale-200 shadow-purple-500/50' 
              : 'bg-gradient-to-br from-blue-400 to-cyan-500 scale-100 shadow-blue-500/50'
          }`}
        />
        
        {/* Orbiting Particles */}
        {[0, 120, 240].map((angle) => (
          <div
            key={angle}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
            style={{
              background: isHovering ? '#c084fc' : '#60a5fa',
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-16px)`,
              animation: `orbit-particle 3s linear infinite`,
              animationDelay: `${angle / 360}s`,
              boxShadow: isHovering ? '0 0 10px #c084fc' : '0 0 8px #60a5fa'
            }}
          />
        ))}
        
        {/* Trailing Effect */}
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full -translate-x-1/2 -translate-y-1/2 ${
              isHovering ? 'bg-purple-400' : 'bg-blue-400'
            }`}
            style={{
              animation: `cursor-trail-${i} 1.2s ease-out infinite`,
              animationDelay: `${i * 0.15}s`,
              opacity: 0
            }}
          />
        ))}
      </div>

      {/* Animated Background Shapes - Enhanced */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Animated Wave Effect */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div
              key={`wave-${i}`}
              className="absolute inset-0 border border-blue-500/20 rounded-full"
              style={{
                animation: `wave-expand ${8 + i * 2}s ease-out infinite`,
                animationDelay: `${i * 1.6}s`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
        
        {/* Floating 3D Shapes with Parallax */}
        {[...Array(15)].map((_, i) => {
          const ShapeIcon = shapes[i % shapes.length].icon;
          const depth = (i % 5) + 1;
          const rotation = (i * 15) % 360;
          return (
            <div
              key={i}
              className={`absolute animate-float ${shapes[i % shapes.length].color} opacity-10`}
              style={{
                left: `${(i * 13) % 100}%`,
                top: `${(i * 19) % 100}%`,
                animationDelay: `${i * 0.25}s`,
                animationDuration: `${12 + (i % 5) * 2}s`,
                transform: `translate(${mousePosition.x * depth * 0.4}px, ${mousePosition.y * depth * 0.4}px) rotate(${rotation}deg) scale(${1 + depth * 0.1})`,
                transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: `blur(${depth * 2}px)`,
                willChange: 'auto'
              }}
            >
              <ShapeIcon size={35 + (i % 5) * 18} strokeWidth={1.5} />
            </div>
          );
        })}
        
        {/* Gradient Orbs with Morph Animation */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className={`absolute w-72 h-72 rounded-full bg-gradient-to-br ${shapes[i].gradient} opacity-5 blur-3xl`}
            style={{
              left: `${(i * 20) % 100}%`,
              top: `${(i * 25) % 100}%`,
              animation: `morph ${10 + i * 2}s ease-in-out infinite, float ${15 + i * 3}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
        
        {/* Sparkle Stars */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 11) % 100}%`,
              animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
              boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
            }}
          />
        ))}
        
        {/* Floating Geometric Lines */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`line-${i}`}
            className="absolute w-px h-32 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"
            style={{
              left: `${(i * 12) % 100}%`,
              top: `${(i * 15) % 100}%`,
              animation: `float ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              transform: `rotate(${i * 45}deg)`
            }}
          />
        ))}
        
        {/* Animated Circles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className="absolute border-2 border-purple-400/20 rounded-full"
            style={{
              width: `${60 + i * 20}px`,
              height: `${60 + i * 20}px`,
              left: `${(i * 16 + 10) % 90}%`,
              top: `${(i * 22 + 5) % 90}%`,
              animation: `breathe ${6 + i}s ease-in-out infinite, float ${10 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
        
        {/* Floating Dots Trail */}
        {[...Array(25)].map((_, i) => (
          <div
            key={`dot-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${(i * 4) % 100}%`,
              top: `${(i * 5.5) % 100}%`,
              background: `linear-gradient(135deg, ${
                ['#60a5fa', '#a78bfa', '#ec4899', '#10b981'][i % 4]
              }, transparent)`,
              animation: `pulse-gentle ${3 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
              opacity: 0.3,
              boxShadow: `0 0 10px ${['#60a5fa', '#a78bfa', '#ec4899', '#10b981'][i % 4]}`
            }}
          />
        ))}
        
        {/* Hexagonal Grid Pattern */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`hex-${i}`}
            className="absolute"
            style={{
              left: `${(i * 8.33) % 100}%`,
              top: `${(i * 12) % 100}%`,
              width: '40px',
              height: '46px',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              animation: `float-gentle ${7 + i}s ease-in-out infinite, spin-slow ${20 + i * 3}s linear infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800/50 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-150 ease-out relative"
          style={{ width: `${scrollProgress}%` }}
        >
          <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-white/50 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Header - Fixed Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 sm:p-2 rounded-lg animate-float-gentle shadow-lg shadow-purple-500/30 hover:shadow-purple-500/60 transition-shadow duration-300">
              <Box className="w-6 h-6 sm:w-8 sm:h-8 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                3D Editor
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Professional 3D Modeling Tool</p>
            </div>
          </div>
          
          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#hero" className="text-sm text-gray-300 hover:text-white transition-colors duration-200 hover:scale-105">Home</a>
            <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors duration-200 hover:scale-105">Features</a>
            <a href="#shapes" className="text-sm text-gray-300 hover:text-white transition-colors duration-200 hover:scale-105">Shapes</a>
            <a href="#technology" className="text-sm text-gray-300 hover:text-white transition-colors duration-200 hover:scale-105">Technology</a>
          </nav>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg transition-all duration-300 hover:scale-105 font-semibold shadow-lg shadow-purple-500/30 text-sm"
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Launch Editor</span>
              <span className="sm:hidden">Launch</span>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-white/10 bg-gray-900/95 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <a 
                href="#hero" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
              >
                Home
              </a>
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
              >
                Features
              </a>
              <a 
                href="#shapes" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
              >
                Shapes
              </a>
              <a 
                href="#technology" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
              >
                Technology
              </a>
            </div>
          </nav>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto text-center">
          {/* Animated Shape Display with 3D Effect - Enhanced */}
          <div className="mb-12 flex justify-center">
            <div className="relative w-40 h-40 animate-float-gentle">
              {/* Multi-layer Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${shapes[currentShape].gradient} opacity-20 blur-3xl animate-breathe`} />
              <div className={`absolute inset-2 bg-gradient-to-br ${shapes[currentShape].gradient} opacity-30 blur-2xl animate-breathe`} style={{ animationDelay: '0.5s' }} />
              
              {/* Rotating Rings - Multi-layer */}
              <div className="absolute inset-0 border-4 border-white/10 rounded-full animate-spin-slow" />
              <div className="absolute inset-4 border-2 border-white/5 rounded-full animate-spin-reverse" />
              <div className="absolute inset-8 border border-white/5 rounded-full" style={{ animation: 'spin-slow 6s linear infinite' }} />
              
              {/* Orbiting Dots */}
              {[0, 90, 180, 270].map((angle) => (
                <div
                  key={angle}
                  className={`absolute w-2 h-2 rounded-full ${shapes[currentShape].color}`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-70px)`,
                    animation: 'orbit-particle 4s linear infinite',
                    animationDelay: `${angle / 360}s`,
                    boxShadow: `0 0 10px ${shapes[currentShape].color}`
                  }}
                />
              ))}
              
              {/* Shape Icons */}
              {shapes.map((shape, index) => {
                const ShapeIcon = shape.icon;
                const isActive = currentShape === index;
                return (
                  <div
                    key={index}
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
                      isActive
                        ? 'opacity-100 scale-110 rotate-0'
                        : 'opacity-0 scale-50 rotate-180'
                    }`}
                  >
                    <div className={`relative ${shape.color}`}>
                      <ShapeIcon size={100} strokeWidth={1.5} className="drop-shadow-2xl animate-pulse-gentle" />
                      {/* Icon Shadow - Enhanced */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${shape.gradient} opacity-40 blur-2xl animate-breathe`} />
                    </div>
                  </div>
                );
              })}
              
              {/* Shape Name */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <p className={`text-sm font-semibold ${shapes[currentShape].color} transition-colors duration-700 animate-pulse-gentle`}>
                  {shapes[currentShape].name}
                </p>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Create Stunning
            </span>
            <br />
            <span className="text-white">3D Models</span>
          </h2>

          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto animate-fade-in-delay leading-relaxed">
            A powerful web-based 3D modeling editor with 75+ shapes, parametric surfaces, 
            and professional-grade tools. Built with React and Three.js.
          </p>

          {/* CTA Buttons - Enhanced with Magnetic Effect */}
          <div className="flex justify-center items-center mb-20 animate-fade-in-delay-2">
            <button
              onClick={onStart}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80 transition-all duration-300 hover:scale-110 hover:-translate-y-1 flex items-center gap-2 overflow-hidden"
            >
              {/* Animated Background Layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 rounded-full blur-xl transition-transform duration-700" />
              
              {/* Shimmer Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000">
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
              </div>
              
              {/* Particle Burst on Hover */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100"
                  style={{
                    left: '50%',
                    top: '50%',
                    animation: `button-particle-${(i % 4) + 1} 0.8s ease-out`,
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              ))}
              
              <Play className="w-5 h-5 relative z-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
              <span className="relative z-10">Start Creating</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>

          {/* Capabilities Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-20 observe-animation">
            {capabilities.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-purple-500/50 cursor-pointer hover:-translate-y-1"
                  style={{ 
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {/* Gradient Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative">
                    <IconComponent className="w-8 h-8 mb-3 mx-auto text-blue-400 group-hover:text-purple-400 transition-all duration-300 group-hover:scale-110" />
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                      {stat.count}
                    </div>
                    <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      {stat.label}
                    </div>
                  </div>
                  
                  {/* Corner Accent */}
                  <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              );
            })}
          </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          {/* Features Showcase */}
          <div className="mb-20 observe-animation">
            <div className="text-center mb-12 observe-animation">
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-fade-in-up">
                Powerful Features
              </h3>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto animate-fade-in-delay">
                Everything you need to create stunning 3D models right in your browser
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:border-purple-500/50 cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-purple-500/30"
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      animation: 'slide-in-up 0.6s ease-out forwards',
                      opacity: 0
                    }}
                  >
                    {/* Animated Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 transition-all duration-500`} />
                    <div className={`absolute -inset-2 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500`} />
                    
                    {/* Particle Effect on Hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-white rounded-full"
                          style={{
                            left: `${(i * 12.5) % 100}%`,
                            top: `${(i * 25) % 100}%`,
                            animation: `particle-float-${(i % 4) + 1} ${1 + (i % 3) * 0.3}s ease-out infinite`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                    
                    <div className="relative">
                      {/* Icon with Gradient Background and Rotation */}
                      <div className={`mb-4 inline-flex p-4 bg-gradient-to-br ${feature.gradient} bg-opacity-20 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 group-hover:shadow-2xl relative`}>
                        <Icon className="w-8 h-8 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500 rounded-xl`} />
                      </div>
                      
                      <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors duration-300 group-hover:translate-x-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Shine Effect on Hover - Enhanced */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                    
                    {/* Corner Accents */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-3xl" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-3xl" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Shapes Section */}
      <section id="shapes" className="relative z-10 py-16 md:py-24 bg-white/5">
        <div className="container mx-auto px-4 md:px-6">
          {/* Shape Categories Preview */}
          <div className="mb-20 observe-animation">
            <div className="text-center mb-12 observe-animation">
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-fade-in-up">
                Extensive Shape Library
              </h3>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto animate-fade-in-delay">
                15 categories with 75+ unique shapes at your fingertips
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
              {[
                { name: 'Basic', icon: Box, color: 'from-blue-500 to-cyan-500', shapes: '8' },
                { name: 'Platonic', icon: Hexagon, color: 'from-purple-500 to-pink-500', shapes: '5' },
                { name: 'Archimedean', icon: Pentagon, color: 'from-green-500 to-emerald-500', shapes: '4' },
                { name: 'Pyramids', icon: Triangle, color: 'from-yellow-500 to-orange-500', shapes: '4' },
                { name: 'Prisms', icon: Cylinder, color: 'from-pink-500 to-rose-500', shapes: '6' },
                { name: 'Round', icon: Circle, color: 'from-indigo-500 to-purple-500', shapes: '8' },
                { name: 'Containers', icon: Square, color: 'from-cyan-500 to-blue-500', shapes: '6' },
                { name: 'Symbols', icon: Heart, color: 'from-red-500 to-pink-500', shapes: '6' },
                { name: 'Nature', icon: Gem, color: 'from-green-500 to-teal-500', shapes: '4' },
                { name: 'Mechanical', icon: RotateCw, color: 'from-gray-500 to-slate-500', shapes: '5' },
                { name: 'Architecture', icon: Diamond, color: 'from-orange-500 to-red-500', shapes: '6' },
                { name: 'Structural', icon: Layers, color: 'from-blue-500 to-purple-500', shapes: '3' },
                { name: 'Mathematical', icon: Star, color: 'from-yellow-500 to-amber-500', shapes: '6' },
                { name: 'Parametric', icon: Sparkles, color: 'from-purple-500 to-fuchsia-500', shapes: '3' },
                { name: 'Sweep/Lathe', icon: RotateCw, color: 'from-pink-500 to-violet-500', shapes: '4' }
              ].map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:border-purple-500/50 cursor-pointer hover:shadow-lg hover:shadow-purple-500/20"
                    style={{ 
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-500`} />
                    
                    <div className="relative text-center">
                      <div className={`inline-flex p-3 bg-gradient-to-br ${category.color} bg-opacity-20 rounded-lg mb-3 group-hover:scale-110 transition-all duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-sm font-bold mb-1 group-hover:text-white transition-colors">
                        {category.name}
                      </h4>
                      <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                        {category.shapes} shapes
                      </p>
                    </div>
                    
                    {/* Pulse effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-20 rounded-xl blur-xl transition-opacity duration-500`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          {/* Technology Stack */}
          <div className="mb-20 observe-animation">
            <div className="text-center mb-8 observe-animation">
              <h3 className="text-3xl font-bold mb-4 text-white animate-fade-in-up">Built With Modern Tech</h3>
              <p className="text-gray-400 animate-fade-in-delay">Powered by industry-leading technologies</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
              {technologies.map((tech, index) => (
                <div
                  key={index}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-6 py-4 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="text-3xl group-hover:scale-110 transition-all duration-300">{tech.icon}</span>
                    <span className="text-lg font-semibold">{tech.name}</span>
                  </div>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300 -z-10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="cta" className="relative z-10 py-12 sm:py-16 md:py-24 observe-animation">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-20 h-20 border-2 border-white/30 rounded-full"
                  style={{
                    left: `${(i * 10) % 100}%`,
                    top: `${(i * 15) % 100}%`,
                    animation: `float ${5 + i}s ease-in-out infinite, morph ${3 + i}s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
            
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white animate-bounce-in">Ready to Start Creating?</h3>
              <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 animate-fade-in-delay">
                Join thousands of creators building amazing 3D models with our editor
              </p>
              
              <button
                onClick={onStart}
                className="group relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-white text-purple-600 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg md:text-xl shadow-2xl hover:shadow-white/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 inline-flex items-center gap-2 sm:gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-white scale-0 group-hover:scale-100 rounded-full blur-2xl transition-transform duration-700 opacity-30" />
                <Play className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">Launch 3D Editor</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="relative z-10 py-8 md:py-12 border-t border-white/10 bg-gray-900/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo & Description */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Box className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  3D Editor
                </span>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                A powerful web-based 3D modeling tool built with React and Three.js
              </p>
            </div>
            
            {/* Technologies */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Powered by</p>
              <div className="flex gap-2">
                {technologies.map((tech, i) => (
                  <span key={i} className="text-2xl" title={tech.name}>
                    {tech.icon}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Links */}
            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-gray-500 text-xs">© 2025 3D Editor. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/80 transition-all duration-300 hover:scale-110 group border-2 border-white/20 ${
          showScrollTop 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <svg
          className="w-6 h-6 text-white group-hover:-translate-y-1 transition-all duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="3"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
        
        {/* Ripple Effect */}
        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-75" style={{ animationDuration: '1s' }} />
      </button>

      <style jsx>{`
        @media (min-width: 768px) {
          * {
            cursor: none !important;
          }
        }
        
        html {
          scroll-behavior: smooth;
          overflow-x: hidden;
        }
        
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .animate-float,
        .animate-float-gentle,
        .animate-breathe,
        .animate-spin-slow,
        .animate-spin-reverse {
          will-change: transform;
        }
        
        ::-webkit-scrollbar {
          width: 12px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #8b5cf6, #ec4899);
          border-radius: 10px;
          border: 2px solid rgba(17, 24, 39, 0.5);
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb, #7c3aed, #db2777);
        }
        
        @keyframes cursor-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.9;
          }
        }
        
        @keyframes cursor-trail {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translate3d(0, 0, 0) rotate(0deg); 
          }
          33% { 
            transform: translate3d(0, -20px, 0) rotate(5deg); 
          }
          66% { 
            transform: translate3d(0, -10px, 0) rotate(-3deg); 
          }
        }
        
        @keyframes float-particle {
          0%, 100% { 
            transform: translate3d(0, 0, 0) scale(1); 
            opacity: 0.6;
          }
          50% { 
            transform: translate3d(0, -100px, 0) scale(1.5); 
            opacity: 0;
          }
        }
        
        @keyframes fade-in {
          from { 
            opacity: 0; 
            transform: translate3d(0, 20px, 0); 
          }
          to { 
            opacity: 1; 
            transform: translate3d(0, 0, 0); 
          }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translate3d(0, 30px, 0); 
          }
          to { 
            opacity: 1; 
            transform: translate3d(0, 0, 0); 
          }
        }
        
        @keyframes spin-slow {
          from { 
            transform: rotate(0deg); 
          }
          to { 
            transform: rotate(360deg); 
          }
        }
        
        @keyframes spin-reverse {
          from { 
            transform: rotate(360deg); 
          }
          to { 
            transform: rotate(0deg); 
          }
        }
        
        @keyframes breathe {
          0%, 100% {
            transform: scale3d(1, 1, 1);
            opacity: 0.2;
          }
          50% {
            transform: scale3d(1.3, 1.3, 1);
            opacity: 0.4;
          }
        }
        
        @keyframes float-gentle {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -15px, 0);
          }
        }
        
        @keyframes morph {
          0%, 100% {
            border-radius: 50%;
            transform: rotate(0deg) scale3d(1, 1, 1);
          }
          50% {
            border-radius: 60% 40% 60% 40% / 50% 60% 40% 50%;
            transform: rotate(90deg) scale3d(1.05, 1.05, 1);
          }
        }
        
        @keyframes slide-in-left {
          from {
            transform: translateX(-100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-in-right {
          from {
            transform: translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale3d(1, 1, 1);
          }
          50% {
            opacity: 0.5;
            transform: scale3d(1.1, 1.1, 1);
          }
        }
        
        @keyframes orbit-particle {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateY(-16px);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) translateY(-16px);
          }
        }
        
        @keyframes cursor-trail-1 {
          0% {
            opacity: 0.8;
            transform: translate(-50%, -50%) translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(-20px, -20px) scale(0.5);
          }
        }
        
        @keyframes cursor-trail-2 {
          0% {
            opacity: 0.6;
            transform: translate(-50%, -50%) translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(20px, -20px) scale(0.5);
          }
        }
        
        @keyframes cursor-trail-3 {
          0% {
            opacity: 0.6;
            transform: translate(-50%, -50%) translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(-20px, 20px) scale(0.5);
          }
        }
        
        @keyframes cursor-trail-4 {
          0% {
            opacity: 0.4;
            transform: translate(-50%, -50%) translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(20px, 20px) scale(0.5);
          }
        }
        
        @keyframes wave-expand {
          0% {
            width: 0;
            height: 0;
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            width: 200vw;
            height: 200vw;
            opacity: 0;
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
        
        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes particle-float-1 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-10px, -30px) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes particle-float-2 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(10px, -30px) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes particle-float-3 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translate(-20px, -25px) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes particle-float-4 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translate(20px, -25px) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes button-particle-1 {
          0% {
            transform: translate(-50%, -50%) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(-40px, -40px);
            opacity: 0;
          }
        }
        
        @keyframes button-particle-2 {
          0% {
            transform: translate(-50%, -50%) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(40px, -40px);
            opacity: 0;
          }
        }
        
        @keyframes button-particle-3 {
          0% {
            transform: translate(-50%, -50%) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(-40px, 40px);
            opacity: 0;
          }
        }
        
        @keyframes button-particle-4 {
          0% {
            transform: translate(-50%, -50%) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(40px, 40px);
            opacity: 0;
          }
        }
        
        @keyframes pulse-gentle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 25px rgba(139, 92, 246, 0.5);
          }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-float-gentle {
          animation: float-gentle 3s ease-in-out infinite;
        }
        
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.15s both;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.3s both;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out both;
        }
        
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .observe-animation {
          opacity: 0;
        }
        
        .observe-animation.animate-fade-in-up {
          opacity: 1;
        }
        
        section {
          scroll-margin-top: 80px;
        }
        
        /* Performance optimizations */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Hardware acceleration for animated elements */
        .group:hover,
        button:hover,
        a:hover {
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        /* Optimize reflows */
        img, video {
          content-visibility: auto;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
