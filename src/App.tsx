import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, useScroll, useTransform, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  MapPin, Info, Home, ChevronDown, Shield,
  Users, BookOpen, Bell,
} from 'lucide-react';
import { Earth } from './components/Earth';
import { Menu, X } from 'lucide-react';
import backgroundImage from './assets/Home-bg.jpg';
import sec1 from './assets/home-sec1.jpg';
import sec11 from './assets/home-sec-1.jpg';
import sec12 from './assets/home-sec-2.jpg';
import safe1 from './assets/safe1.jpg';
import safe2 from './assets/safe2.jpeg';
import './App.css';
import vid from './assets/vid/Safety-vid.mp4';

function App() {
  const [percentage, setPercentage] = useState(0);
  const controls = useAnimation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0]);

  const [safetyRef, safetyInView] = useInView({
    threshold: 0.2,
  });

  useEffect(() => {
    setHideNav(safetyInView);
  }, [safetyInView]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const easeOutQuad = (t) => t * (2 - t);


  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const section = document.getElementById("safety-section");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          controls.start({ scale: 1, opacity: 1 });

          let start = 0;
          let end = 68;
          let duration = 2000; // 2 seconds
          let startTime = null;

          const animateCount = (timestamp) => {
            if (!startTime) startTime = timestamp;
            let progress = (timestamp - startTime) / duration;
            if (progress > 1) progress = 1;
            let easedProgress = easeOutQuad(progress);
            let currentCount = Math.floor(start + (end - start) * easedProgress);
            setPercentage(currentCount);

            if (progress < 1) {
              requestAnimationFrame(animateCount);
            }
          };

          requestAnimationFrame(animateCount);
          setHasAnimated(true); // Ensures animation only happens once
        }
      },
      { threshold: 0.5 } // Triggers when 50% of the section is visible
    );

    observer.observe(section);

    return () => {
      if (section) observer.unobserve(section);
    };
  }, [controls, hasAnimated]);


  return (
    <div>
      {/* Enhanced Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-500 ${
          isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
        } ${hideNav ? 'hidden' : 'block'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20 items-center">
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="h-8 w-8 md:h-10 md:w-10 text-rose-500" />
              <span className="ml-2 text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 transition-all">
                SafeGuardian
              </span>
            </motion.div>

            {/* Hamburger Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-rose-500 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
              <NavLink icon={<Home className="h-5 w-5" />} text="Home" to="/"/>
              <NavLink icon={<MapPin className="h-5 w-5" />} text="Location" to="/detectlocation" />
              <NavLink icon={<Bell className="h-5 w-5" />} text="Alerts" to="/alert" />
              <NavLink icon={<Info className="h-5 w-5" />} text="About" to="/about" />
            </div>
          </div>

          {/* Mobile Menu */}
          <motion.div
            className={`md:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-md shadow-lg ${
              isMobileMenuOpen ? 'block' : 'hidden'
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={isMobileMenuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 pt-2 pb-4 space-y-2">
              <NavLink icon={<Home className="h-5 w-5" />} text="Home" to="/" />
              <NavLink icon={<MapPin className="h-5 w-5" />} text="Location" to="/detectlocation" />
              <NavLink icon={<Bell className="h-5 w-5" />} text="Alerts" to="/alert" />
              <NavLink icon={<Info className="h-5 w-5" />} text="About" to="/about" />
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="min-h-screen pt-20 relative overflow-hidden"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-white/50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[calc(100vh-5rem)]">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Your Safety is Our{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
                  Priority
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                Empowering women with real-time safety solutions and community support.
              </p>
              <motion.button
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Now
              </motion.button>
            </motion.div>
            <div className="relative h-[300px] sm:h-[400px] md:h-[600px] w-full">
              <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Suspense fallback={null}>
                  <Earth />
                  <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                </Suspense>
              </Canvas>
            </div>
          </div>
        </div>
        <motion.div className="absolute bottom-8 left-1/2 transform -translate-x-1/2" style={{ opacity }}>
          <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500 animate-bounce" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="hidden lg:flex flex-col items-center space-y-6"
          >
            <img src={safe1} alt="Cross pattern 1" className="w-48 h-48 object-cover rounded-xl shadow-2xl transform rotate-45 border-4 border-black" />
            <img src={safe2} alt="Cross pattern 2" className="w-48 h-48 object-cover rounded-xl shadow-2xl transform -rotate-45 border-4 border-black" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center lg:col-span-1"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black mb-4 sm:mb-6 uppercase font-sans">
              Your Safety First
            </h2>
            <p className="text-lg sm:text-xl text-gray-800 font-light leading-relaxed">
              Discover a new standard of protection with our innovative safety solutions.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6 flex flex-col items-center lg:items-end"
          >
            <FeatureCard icon={<MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-black" />} title="Live Tracking" description="Real-time location monitoring" />
            <FeatureCard icon={<Bell className="w-6 h-6 sm:w-8 sm:h-8 text-black" />} title="Instant Alerts" description="Rapid emergency response" />
            <FeatureCard icon={<Users className="w-6 h-6 sm:w-8 sm:h-8 text-black" />} title="Community" description="Connected safety network" />
          </motion.div>
        </div>
      </section>

      {/* Empowerment Section */}
      <section
  className="py-16 sm:py-20 relative bg-cover bg-center overflow-hidden"
  style={{ backgroundImage: `url(${sec1})`, minHeight: "100vh" }}
>
  {/* Enhanced Overlay with Gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-rose-900/20"></div>

  {/* Decorative Floating Elements */}
  <div className="absolute top-10 left-10 w-20 h-20 bg-rose-400/20 rounded-full filter blur-xl animate-pulse"></div>
  <div className="absolute bottom-20 right-20 w-32 h-32 bg-purple-400/20 rounded-full filter blur-2xl animate-pulse delay-200"></div>

  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Enhanced Header Section */}
    <motion.div
      className="text-center mb-12 sm:mb-16"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-5 tracking-tight">
        <span className="relative inline-block">
          Empowering Women
          <span className="absolute -bottom-2 left-0 w-full h-1 bg-rose-500 rounded-full"></span>
        </span>
        , Ensuring Safety
      </h2>
      <p className="text-lg sm:text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto leading-relaxed">
        Join our transformative initiative to foster a secure, inclusive world where women thrive with confidence and dignity.
      </p>
    </motion.div>

    {/* Grid Layout with Enhanced Design */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
      {/* Image Column with Hover Effects */}
      <div className="flex flex-col gap-6">
        <motion.div
          className="group rounded-2xl overflow-hidden shadow-2xl relative"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          whileHover={{ scale: 1.03 }}
        >
          <img
            src={sec11}
            alt="Women Empowerment"
            className="w-full h-48 sm:h-60 md:h-72 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/20 transition-all duration-500"></div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
            <span className="text-white text-lg font-semibold glowing-text">Inspire Change</span>
          </div>
        </motion.div>
        <motion.div
          className="group rounded-2xl overflow-hidden shadow-2xl relative"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          whileHover={{ scale: 1.03 }}
        >
          <img
            src={sec12}
            alt="Women Supporting Each Other"
            className="w-full h-48 sm:h-60 md:h-72 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/20 transition-all duration-500"></div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
            <span className="text-white text-lg font-semibold glowing-text">Build Community</span>
          </div>
        </motion.div>
      </div>

      {/* Content Card with Enhanced Styling */}
      <motion.div
        className="p-6 sm:p-8 bg-white/95 shadow-2xl rounded-3xl relative backdrop-blur-md border border-gray-100/20"
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Enhanced Icon */}
        <div className="absolute -top-8 -left-8 sm:-top-10 sm:-left-10 bg-gradient-to-br from-rose-500 to-purple-600 p-4 sm:p-6 rounded-full shadow-xl transform hover:rotate-12 transition-transform duration-300">
          <Shield className="w-8 h-8 sm:w-12 sm:h-12 text-white glowing-icon" />
        </div>

        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 relative">
          Women's Safety & Security
          <span className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-rose-500 to-purple-600 rounded-full"></span>
        </h3>
        <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-6">
          Our community is committed to safeguarding women through cutting-edge solutions, supportive networks, and innovative online platforms designed to empower and protect.
        </p>
        <button className="mt-4 sm:mt-6 px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 glowing-button">
          Discover More
        </button>
      </motion.div>
    </div>
  </div>

  {/* Custom CSS for Glowing Effects */}
  <style jsx>{`
    .glowing-text {
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6);
    }
    .glowing-icon {
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
    }
    .glowing-button {
      box-shadow: 0 0 15px rgba(244, 114, 182, 0.5);
    }
  `}</style>
</section>

      {/* Safety Tips Section */}
      <section
        id="safety-section"
        ref={safetyRef}
        className="min-h-screen py-16 sm:py-20 relative overflow-hidden"
      >
        <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover z-0">
          <source src={vid} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/60 z-10" />
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="w-full h-full bg-rose-900/40 clip-path-cross-line" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
          <motion.div
            className="text-center mb-12 sm:mb-20"
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white drop-shadow-lg"
              style={{ fontFamily: "'Sacramento', cursive", color: '#ffe4e6', textShadow: '3px 3px 6px rgba(0, 0, 0, 0.6)' }}
            >
              Safety Tips
            </h2>
          </motion.div>
          <div className="flex flex-col lg:flex-row justify-end items-center h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)]">
            <div className="w-full lg:w-1/2 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
              <div className="flex flex-col items-center gap-6 sm:gap-8 lg:gap-12">
                <motion.div
                  className="w-72 sm:w-80 md:w-96 h-72 sm:h-80 md:h-96 bg-white/20 backdrop-blur-lg border-2 border-rose-300 shadow-2xl transform rotate-45 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 transform -rotate-45 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-rose-600 mb-2 sm:mb-4" />
                    <h3
                      className="text-xl sm:text-2xl md:text-3xl text-black text-center"
                      style={{ fontFamily: "'Great Vibes', cursive' "}}
                    >
                      <span className="inline-block animate-text-reveal">Stay Aware</span>
                    </h3>
                    <p className="text-rose-800 text-sm sm:text-base md:text-lg font-light text-center mt-2 sm:mt-3">
                      Stay vigilant in public spaces, avoid isolated areas, and trust your instincts.
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  className="w-72 sm:w-80 md:w-96 h-72 sm:h-80 md:h-96 bg-white/20 backdrop-blur-lg border-2 border-rose-300 shadow-2xl transform rotate-45 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 transform -rotate-45 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
                    <Shield className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-rose-600 mb-2 sm:mb-4" />
                    <h3
                      className="text-xl sm:text-2xl md:text-3xl text-black text-center"
                      style={{ fontFamily: "'Great Vibes', cursive' "}}
                    >
                      <span className="inline-block animate-text-reveal">Share Location</span>
                    </h3>
                    <p className="text-rose-800 text-sm sm:text-base md:text-lg font-light text-center mt-2 sm:mt-3">
                      Use apps to share your live location with trusted contacts.
                    </p>
                  </div>
                </motion.div>
              </div>
              <motion.div
                className="text-center lg:ml-8"
                initial={{ scale: 0, opacity: 0 }}
                animate={controls}
                transition={{ duration: 0.8 }}
              >
                <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white drop-shadow-3d">
                  {percentage}%
                </div>
                <p
                  className="text-lg sm:text-xl md:text-2xl text-rose-200 mt-1 sm:mt-2"
                  style={{ fontFamily: "'Sacramento', cursive' "}}
                >
                  Women's Safety Index
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function NavLink({ icon, text, to }: { icon: React.ReactNode; text: string; to: string }) {
  return (
    <motion.a
      href={to}
      className="flex items-center space-x-2 text-gray-700 hover:text-rose-500 transition-all duration-300 px-4 py-2 rounded-full hover:bg-rose-50 w-full md:w-auto"
      // Initial state
      initial={{
        y: 0,
        rotateX: 0,
        rotateY: 0,
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)"
      }}
      // Hover animation with 3D effects
      whileHover={{
        scale: 1.05,
        y: -4, // Slight lift effect
        rotateX: 5, // 3D tilt on X axis
        rotateY: 2, // 3D tilt on Y axis
        boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)", // Enhanced shadow
        transition: {
          duration: 0.2,
          ease: "easeOut"
        }
      }}
      // Tap animation
      whileTap={{
        scale: 0.95,
        y: 1,
        rotateX: 0,
        rotateY: 0,
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)"
      }}
      // Add perspective for better 3D effect
      style={{ perspective: 1000 }}
    >
      {icon}
      <span className="font-medium text-base">{text}</span>
    </motion.a>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-rose-100 w-full max-w-xs"
    >
      <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
        <div className="p-3 sm:p-4 bg-rose-50 rounded-full">{icon}</div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">{title}</h3>
        <p className="text-sm sm:text-base text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
}

export default App;