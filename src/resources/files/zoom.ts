/** The size an image is drawn at, as a percent of its own pixels: `scale` over the fitted width. */
export function percentOf(scale: number, fitted: number, natural: number): number {
  return natural > 0 && fitted > 0 ? Math.round((fitted * scale * 100) / natural) : Math.round(scale * 100);
}
