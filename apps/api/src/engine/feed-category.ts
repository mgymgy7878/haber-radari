import { ContentType } from './publish-gate.js';
import {
  containsDisasterAlertSignal,
  containsEarthquakeSignal,
  containsEnvironmentSignal,
  containsHumanitarianSignal,
  containsSportContext,
} from './turkish-text-match.js';

/** Smart Feed yanıtı için öncelikli kategori çözümlemesi. */
export function resolveFeedCategory(
  combinedText: string,
  contentType: ContentType,
  fallbackCategory: string,
): string {
  if (containsEarthquakeSignal(combinedText)) {
    return 'Afet / Deprem';
  }

  if (containsDisasterAlertSignal(combinedText) && !containsSportContext(combinedText)) {
    return 'Afet';
  }

  if (containsSportContext(combinedText) || contentType === ContentType.SPORTS) {
    if (containsSportContext(combinedText) && /formula|grand prix|f1|formül 1/i.test(combinedText)) {
      return 'Spor / Motor sporları';
    }
    return 'Spor';
  }

  if (containsHumanitarianSignal(combinedText)) {
    return 'Dış Yardım / İnsani Yardım';
  }

  if (containsEnvironmentSignal(combinedText)) {
    return 'Çevre / Halk Sağlığı';
  }

  if (contentType === ContentType.POLITICAL_STATEMENT) {
    return 'Siyaset / Açıklama';
  }

  return fallbackCategory || 'Genel / Diğer';
}
