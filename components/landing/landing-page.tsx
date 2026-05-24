"use client";

import { LandingNavbar } from "./navbar";
import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { BenefitsSection } from "./benefits-section";
import { HowItWorksSection } from "./how-it-works-section";
import { TestimonialsSection } from "./testimonials-section";
import { CTASection } from "./cta-section";
import { Footer } from "./footer";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#ffffff] overflow-x-hidden font-sans selection:bg-emerald-500 selection:text-white pb-0">
      {/* Floating Pill Glass Navbar */}
      <LandingNavbar />

      {/* Hero Section containing the H1 and Interactive Tab Simulator */}
      <HeroSection />

      {/* Features Bento Grid Section */}
      <FeaturesSection />

      {/* Cinematic Dark Section & Live AI Roast Feed */}
      <BenefitsSection />

      {/* Stepped Timeline Section */}
      <HowItWorksSection />

      {/* Testimonials Grid Section */}
      <TestimonialsSection />

      {/* Apple-style Monochrome CTA Section */}
      <CTASection />

      {/* Clean Modern Footer */}
      <Footer />
    </div>
  );
}
