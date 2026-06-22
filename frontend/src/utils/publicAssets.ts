const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const publicAssets = {
  brandLogo: asset("cabecera1.png"),
  footerBanner: asset("LosChillos-footer.png"),
} as const;
