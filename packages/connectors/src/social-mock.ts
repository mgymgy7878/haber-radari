import { SAMPLE_SOCIAL_SIGNALS, type SocialSignal } from "@haber-radari/news-core";

export async function fetchSocialSignalsMock(): Promise<SocialSignal[]> {
  return SAMPLE_SOCIAL_SIGNALS;
}
