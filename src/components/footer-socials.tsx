import Image from 'next/image';
import { socialConfig } from '@/config/social';

const FooterSocials = () => {
  return (
    <div className="flex items-center justify-center gap-[10px]">
      {socialConfig.map(({ url, name, iconPath, width, height }) => (
        <a
          key={name}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex size-[24px] items-center justify-center transition-opacity hover:opacity-80 active:scale-95 active:opacity-80"
        >
          <Image
            src={iconPath}
            alt={`${name} icon`}
            loading="lazy"
            width={width}
            height={height}
          />
        </a>
      ))}
    </div>
  );
};

export default FooterSocials;
