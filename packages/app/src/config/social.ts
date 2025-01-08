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
  createSocialConfig('X', 24, 24, 'https://x.com/ringecosystem'),
  createSocialConfig('Telegram', 24, 24, 'https://t.me/ringecosystem'),
  createSocialConfig(
    'Github',
    24,
    24,
    'https://github.com/ringecosystem/paralink'
  ),
  createSocialConfig('Discord', 24, 24, 'https://discord.gg/BhNbKWWfGV')
];
