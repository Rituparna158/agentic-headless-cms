export const isYouTube = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

export const getYouTubeEmbedUrl = (url: string): string => {
  if (url.includes('embed')) return url;
  try {
    const urlObj = new URL(url);
    let videoId = '';
    if (url.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    } else {
      videoId = urlObj.searchParams.get('v') || '';
    }
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return url;
  }
};
