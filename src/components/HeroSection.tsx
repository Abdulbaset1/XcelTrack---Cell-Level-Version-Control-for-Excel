import React from 'react';
import { Link } from 'react-router-dom';
import BlurText from './BlurText';
import RippleGrid from './RippleGrid';

const HeroSection: React.FC = () => {
    return (
        <section className="relative py-20 overflow-hidden">
            {/* RippleGrid Background Animation */}
            <div className="absolute inset-0 z-0" style={{ height: '100%' }} aria-hidden="true">
                <RippleGrid
                    enableRainbow={false}
                    gridColor="#0d1015e3"
                    rippleIntensity={0.1}
                    gridSize={16}
                    gridThickness={26}
                    mouseInteraction={true}
                    mouseInteractionRadius={3.5}
                    opacity={0.15}
                    vignetteStrength={2.8}
                    glowIntensity={0.15}
                    isStatic={true}
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                <div className="inline-block mb-4 px-4 py-1 rounded-full bg-sapphire-900/5 border border-sapphire-900/10 backdrop-blur-sm">
                    <span className="text-[#081F62] text-sm font-medium">✨ The Future of Excel Collaboration</span>
                </div>

                <div className="text-5xl md:text-7xl font-bold mb-6 text-[#051747] leading-tight flex flex-col items-center justify-center">
                    <div className="flex flex-wrap justify-center gap-x-3 md:gap-x-4">
                        <BlurText text="Where" delay={150} animateBy="words" direction="top" className="text-[#051747]" />
                        <BlurText text="Excel" delay={150} animateBy="words" direction="top" className="text-sapphire-600" />
                        <BlurText text="meets" delay={150} animateBy="words" direction="top" className="text-[#051747]" />
                    </div>
                    <div className="mt-2 md:mt-4">
                        <BlurText text="Version Control" delay={150} animateBy="words" direction="top" className="text-sapphire-600" />
                    </div>
                </div>

                <p className="text-xl md:text-2xl text-[#535F79] mb-10 max-w-3xl mx-auto leading-relaxed">
                    XcelTrack brings powerful version control to your spreadsheets.
                    Track changes, collaborate seamlessly, and never lose your work again.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                    <Link
                        to="/signup"
                        className="group relative overflow-hidden bg-sapphire-600 hover:bg-sapphire-900 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto text-center"
                    >
                        <span className="relative z-10">Start for free</span>
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent ease-in-out" aria-hidden="true" />
                    </Link>
                    <button className="btn-watch-demo w-full sm:w-auto shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Watch Demo
                    </button>
                </div>

                {/* Feature Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Card 1: Blue */}
                    <div className="relative group">
                        {/* Colorful Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-20" aria-hidden="true" />

                        {/* Tilted Dark Background */}
                        <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-3 translate-y-2 translate-x-2 -z-10 transition-transform duration-300" aria-hidden="true"></div>

                        <div className="hover-card border-2 border-sapphire-900/30 p-8 rounded-2xl h-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-white">
                            <div className="w-14 h-14 bg-sapphire-50 rounded-xl mb-6 mx-auto flex items-center justify-center border border-sapphire-50 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Cell-Level Tracking</h3>
                            <p className="leading-relaxed">Track changes at individual cell level. See exactly who changed what and why.</p>
                        </div>
                    </div>

                    {/* Card 2: Purple */}
                    <div className="relative group">
                        {/* Colorful Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/100 to-purple-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-20" aria-hidden="true" />

                        {/* Tilted Dark Background */}
                        <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-3 translate-y-2 translate-x-2 -z-10 transition-transform duration-300" aria-hidden="true"></div>

                        <div className="hover-card border-2 border-sapphire-900/30 p-8 rounded-2xl h-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-white">
                            <div className="w-14 h-14 bg-purple-50 rounded-xl mb-6 mx-auto flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">AI Assistance</h3>
                            <p className="leading-relaxed">Get instant formula explanations, error detection, and anomaly alerts.</p>
                        </div>
                    </div>

                    {/* Card 3: Indigo */}
                    <div className="relative group">
                        {/* Colorful Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/100 to-indigo-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-20" aria-hidden="true" />

                        {/* Tilted Dark Background */}
                        <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-3 translate-y-2 translate-x-2 -z-10 transition-transform duration-300" aria-hidden="true"></div>

                        <div className="hover-card border-2 border-sapphire-900/30 p-8 rounded-2xl h-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-white">
                            <div className="w-14 h-14 bg-indigo-50 rounded-xl mb-6 mx-auto flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Real-Time Sync</h3>
                            <p className="leading-relaxed">Collaborate seamlessly with your team. Work online or offline with smart sync.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
