import React, { useState, useEffect } from "react";

interface ChannelLogoProps {
  src: string;
  name: string;
  className?: string;
}

export const ChannelLogo: React.FC<ChannelLogoProps> = ({ src, name, className }) => {
  const defaultLogo = "https://img.icons8.com/emoji/96/television.png";
  const [imgSrc, setImgSrc] = useState(src || defaultLogo);
  const [hasError, setHasError] = useState(false);

  // When src changes, reset error states and try the new source
  useEffect(() => {
    setImgSrc(src || defaultLogo);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(defaultLogo);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={name}
      referrerPolicy="no-referrer"
      className={className}
      onError={handleError}
    />
  );
};
