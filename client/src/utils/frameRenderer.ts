export function renderFrame(width: number, rightWidth: number): string {
  const contentWidth = 90;
  const leftContentWidth = contentWidth - rightWidth - 1;
  const frameWidth = width;
  
  const top = "+" + "-".repeat(frameWidth - 2) + "+";
  const split = "+" + "-".repeat(leftContentWidth) + "+" + "-".repeat(rightWidth) + "+";
  const bottom = "+" + "-".repeat(frameWidth - 2) + "+";
  
  let frame = top + "\n";
  frame += "|" + " ".repeat(frameWidth - 2) + "|\n";
  frame += split + "\n";
  frame += "|" + " ".repeat(leftContentWidth) + "|" + " ".repeat(rightWidth) + "|\n";
  
  for (let i = 0; i < 18; i++) {
    frame += "|" + " ".repeat(leftContentWidth) + "|" + " ".repeat(rightWidth) + "|\n";
  }
  
  frame += split + "\n";
  frame += "|" + " ".repeat(frameWidth - 2) + "|\n";
  frame += bottom;
  
  return frame;
}
