import React, { useState, useEffect, memo } from "react";

interface ChannelLogoProps {
  src: string;
  name: string;
  className?: string;
}

export const ChannelLogo = memo<ChannelLogoProps>(({ src, name, className }) => {
  const defaultLogo = "https://img.icons8.com/emoji/96/television.png";
  const [imgSrc, setImgSrc] = useState(src || defaultLogo);
  const [hasError, setHasError] = useState(false);

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
});

ChannelLogo.displayName = "ChannelLogo";
