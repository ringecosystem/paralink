type SocialConfig = {
  url: string;
  name: string;
  width: number;
  height: number;
  iconPath: string;
};

function createSocialConfig(
  name: string,
  width: number,
  height: number,
  url: string
): SocialConfig {
  return {
    name,
    url,
    width,
    height,
    iconPath: `/images/socials/${name.toLowerCase()}.svg`
  };
}

export const socialConfig: SocialConfig[] = [
  createSocialConfig('X', 12, 12, 'https://x.com/ringecosystem'),
  createSocialConfig('Telegram', 12, 10, 'https://t.me/ringecosystem'),
  createSocialConfig('Github', 12, 14, 'https://github.com/ringecosystem/'),
  createSocialConfig('Discord', 12, 10, 'https://discord.gg/BhNbKWWfGV')
];
