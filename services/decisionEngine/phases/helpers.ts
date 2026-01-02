export function closenessCodeToNumeric(closeness: string | number): number {
  if (typeof closeness === 'number') {
    return closeness;
  }
  
  const closenessMap: Record<string, number> = {
    'distant': 1,
    'neutral': 2,
    'close': 4,
    'very_close': 5,
  };
  
  return closenessMap[closeness] ?? 3;
}

export function importanceCodeToNumeric(importance: string | number): number {
  if (typeof importance === 'number') {
    return importance;
  }
  
  const importanceMap: Record<string, number> = {
    'optional': 1,
    'important': 3,
    'very_important': 5,
  };
  
  return importanceMap[importance] ?? 3;
}
