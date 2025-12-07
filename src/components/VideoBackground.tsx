import React from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  overlay?: boolean;
  children?: React.ReactNode;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  videoSrc, 
  overlay = true, 
  children 
}) => {
  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden">
      {/* Video Background */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/80 via-purple-900/70 to-navy-800/80 backdrop-blur-[1px]"></div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default VideoBackground;