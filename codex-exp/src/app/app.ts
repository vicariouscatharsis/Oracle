import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';

interface UselessFact {
  id: string;
  text: string;
  source: string;
  source_url: string;
  language: string;
  permalink: string;
}

interface AdviceSlip {
  id: number;
  advice: string;
}

interface AdviceResponse {
  slip: AdviceSlip;
}

interface YesNoAnswer {
  answer: string;
  forced: boolean;
  image: string;
}

interface EmojiReading {
  name: string;
  category: string;
  group: string;
  htmlCode: string[];
  unicode: string[];
}

interface CardReading {
  code: string;
  image: string;
  value: string;
  suit: string;
}

interface CardResponse {
  success: boolean;
  deck_id: string;
  cards: CardReading[];
  remaining: number;
}

interface GiphyImage {
  url: string;
}

interface GiphyGif {
  id: string;
  title: string;
  url: string;
  images: {
    downsized_medium?: GiphyImage;
    fixed_height?: GiphyImage;
    original?: GiphyImage;
  };
}

interface GiphyResponse {
  data: GiphyGif;
}

interface NumberReading {
  number: number;
  ordinal: string;
  parity: string;
  binary: string;
  hexadecimal: string;
  digitSum: number;
}

interface NumberBaseResponse {
  contents: {
    answer: string;
  };
}

type AnswerType = 'yesNo' | 'card' | 'number' | 'giphy' | 'emoji' | 'advice' | 'fact';
type RevealState = Record<AnswerType, boolean>;

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrls = {
    fact: 'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en',
    advice: 'https://api.adviceslip.com/advice',
    yesNo: 'https://yesno.wtf/api',
    emoji: 'https://emojihub.yurace.pro/api/random',
    card: 'https://deckofcardsapi.com/api/deck/new/draw/?count=1',
    giphy: 'https://api.giphy.com/v1/gifs/random',
    number: 'https://api.math.tools/numbers/base'
  } as const;
  private readonly giphyApiKeyStorageKey = 'giphy-api-key';
  private readonly defaultGiphyApiKey = '7BfvATyFP9td3IDpkf5FPYqXW9Uv2jpu';
  protected readonly answerTypes: ReadonlyArray<{ key: AnswerType; label: string }> = [
    { key: 'yesNo', label: 'Yes / No' },
    { key: 'card', label: 'Card' },
    { key: 'number', label: 'Number' },
    { key: 'giphy', label: 'GIF' },
    { key: 'emoji', label: 'Emoji' },
    { key: 'advice', label: 'Advice' },
    { key: 'fact', label: 'Fact' }
  ];
  protected readonly selectedAnswerType = signal<AnswerType>('yesNo');
  protected readonly revealedAnswers = signal<RevealState>({
    yesNo: false,
    card: false,
    number: false,
    giphy: false,
    emoji: false,
    advice: false,
    fact: false
  });

  protected readonly fact = signal<UselessFact | null>(null);
  protected readonly factErrorMessage = signal('');
  protected readonly isFactLoading = signal(false);
  protected readonly advice = signal<AdviceSlip | null>(null);
  protected readonly adviceErrorMessage = signal('');
  protected readonly isAdviceLoading = signal(false);
  protected readonly yesNoAnswer = signal<YesNoAnswer | null>(null);
  protected readonly yesNoErrorMessage = signal('');
  protected readonly isYesNoLoading = signal(false);
  protected readonly emojiReading = signal<EmojiReading | null>(null);
  protected readonly emojiErrorMessage = signal('');
  protected readonly isEmojiLoading = signal(false);
  protected readonly cardReading = signal<CardReading | null>(null);
  protected readonly cardErrorMessage = signal('');
  protected readonly isCardLoading = signal(false);
  protected readonly giphyApiKey = signal('');
  protected readonly giphyReading = signal<GiphyGif | null>(null);
  protected readonly giphyErrorMessage = signal('');
  protected readonly isGiphyLoading = signal(false);
  protected readonly numberReading = signal<NumberReading | null>(null);
  protected readonly numberErrorMessage = signal('');
  protected readonly isNumberLoading = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.giphyApiKey.set(localStorage.getItem(this.giphyApiKeyStorageKey) ?? this.defaultGiphyApiKey);
    }
  }

  selectAnswerType(type: AnswerType): void {
    this.selectedAnswerType.set(type);
    this.setRevealState(type, false);
  }

  protected selectedTitle(): string {
    switch (this.selectedAnswerType()) {
      case 'yesNo':
        return 'A yes or no from the universe.';
      case 'card':
        return 'A playing card with a private meaning.';
      case 'number':
        return 'A number with a hidden structure.';
      case 'giphy':
        return 'A moving sign from the weird current.';
      case 'emoji':
        return 'A symbol pulled from the unseen.';
      case 'advice':
        return 'A direct answer through the glass.';
      case 'fact':
        return 'A sign hidden in strange knowledge.';
    }
  }

  protected selectedEyebrow(): string {
    switch (this.selectedAnswerType()) {
      case 'yesNo':
        return 'The Pendulum Gate';
      case 'card':
        return 'The Card Oracle';
      case 'number':
        return 'The Number Oracle';
      case 'giphy':
        return 'The GIF Oracle';
      case 'emoji':
        return 'The Glyph Bowl';
      case 'advice':
        return 'The Crystal Counsel';
      case 'fact':
        return 'The Omen Archive';
    }
  }

  protected selectedActionLabel(): string {
    switch (this.selectedAnswerType()) {
      case 'yesNo':
        return this.isYesNoLoading() ? 'Swinging...' : 'Ask yes or no';
      case 'card':
        return this.isCardLoading() ? 'Drawing...' : 'Draw a card';
      case 'number':
        return this.isNumberLoading() ? 'Counting...' : 'Draw a number';
      case 'giphy':
        return this.isGiphyLoading() ? 'Summoning...' : 'Summon a GIF';
      case 'emoji':
        return this.isEmojiLoading() ? 'Drawing...' : 'Draw an emoji';
      case 'advice':
        return this.isAdviceLoading() ? 'Consulting...' : 'Consult the crystal';
      case 'fact':
        return this.isFactLoading() ? 'Reading the omen...' : 'Draw a fact';
    }
  }

  protected isSelectedLoading(): boolean {
    switch (this.selectedAnswerType()) {
      case 'yesNo':
        return this.isYesNoLoading();
      case 'card':
        return this.isCardLoading();
      case 'number':
        return this.isNumberLoading();
      case 'giphy':
        return this.isGiphyLoading();
      case 'emoji':
        return this.isEmojiLoading();
      case 'advice':
        return this.isAdviceLoading();
      case 'fact':
        return this.isFactLoading();
    }
  }

  protected selectedErrorMessage(): string {
    switch (this.selectedAnswerType()) {
      case 'yesNo':
        return this.yesNoErrorMessage();
      case 'card':
        return this.cardErrorMessage();
      case 'number':
        return this.numberErrorMessage();
      case 'giphy':
        return this.giphyErrorMessage();
      case 'emoji':
        return this.emojiErrorMessage();
      case 'advice':
        return this.adviceErrorMessage();
      case 'fact':
        return this.factErrorMessage();
    }
  }

  protected loadSelectedAnswer(): Promise<void> {
    switch (this.selectedAnswerType()) {
      case 'yesNo':
        return this.loadYesNoAnswer();
      case 'card':
        return this.loadCardReading();
      case 'number':
        return this.loadNumberReading();
      case 'giphy':
        return this.loadGiphyReading();
      case 'emoji':
        return this.loadEmojiReading();
      case 'advice':
        return this.loadAdvice();
      case 'fact':
        return this.loadFact();
    }
  }

  protected isSelectedRevealed(): boolean {
    return this.revealedAnswers()[this.selectedAnswerType()];
  }

  updateGiphyApiKey(event: Event): void {
    const apiKey = (event.target as HTMLInputElement).value.trim();
    this.giphyApiKey.set(apiKey);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.giphyApiKeyStorageKey, apiKey);
    }
  }

  async loadFact(): Promise<void> {
    this.isFactLoading.set(true);
    this.factErrorMessage.set('');

    try {
      const response = await fetch(this.withFreshParam(this.apiUrls.fact), {
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('The omen archive did not answer.');
      }

      this.fact.set(await response.json() as UselessFact);
      this.setRevealState('fact', true);
    } catch {
      this.factErrorMessage.set('The stars went quiet. Ask again in a moment.');
    } finally {
      this.isFactLoading.set(false);
    }
  }

  async loadAdvice(): Promise<void> {
    this.isAdviceLoading.set(true);
    this.adviceErrorMessage.set('');

    try {
      const response = await fetch(this.withFreshParam(this.apiUrls.advice), {
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('The oracle did not answer.');
      }

      const adviceResponse = await response.json() as AdviceResponse;
      this.advice.set(adviceResponse.slip);
      this.setRevealState('advice', true);
    } catch {
      this.adviceErrorMessage.set('The crystal dimmed. Ask again in a moment.');
    } finally {
      this.isAdviceLoading.set(false);
    }
  }

  async loadYesNoAnswer(): Promise<void> {
    this.isYesNoLoading.set(true);
    this.yesNoErrorMessage.set('');

    try {
      const response = await fetch(this.withFreshParam(this.apiUrls.yesNo), {
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('The pendulum did not answer.');
      }

      const yesNoAnswer = await response.json() as YesNoAnswer;
      await this.preloadImage(yesNoAnswer.image);
      this.yesNoAnswer.set(yesNoAnswer);
      this.setRevealState('yesNo', true);
    } catch {
      this.yesNoErrorMessage.set('The pendulum stopped moving. Ask again in a moment.');
    } finally {
      this.isYesNoLoading.set(false);
    }
  }

  async loadEmojiReading(): Promise<void> {
    this.isEmojiLoading.set(true);
    this.emojiErrorMessage.set('');

    try {
      const emoji = await this.fetchAllowedEmoji();
      this.emojiReading.set(emoji);
      this.setRevealState('emoji', true);
    } catch {
      this.emojiErrorMessage.set('The glyph bowl scattered. Ask again in a moment.');
    } finally {
      this.isEmojiLoading.set(false);
    }
  }

  async loadCardReading(): Promise<void> {
    this.isCardLoading.set(true);
    this.cardErrorMessage.set('');

    try {
      const response = await fetch(this.withFreshParam(this.apiUrls.card), {
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('The card table did not answer.');
      }

      const cardResponse = await response.json() as CardResponse;
      const card = cardResponse.cards[0];

      if (!card) {
        throw new Error('No card was drawn.');
      }

      await this.preloadImage(card.image);
      this.cardReading.set(card);
      this.setRevealState('card', true);
    } catch {
      this.cardErrorMessage.set('The deck slipped from view. Ask again in a moment.');
    } finally {
      this.isCardLoading.set(false);
    }
  }

  async loadGiphyReading(): Promise<void> {
    if (!this.giphyApiKey()) {
      this.giphyErrorMessage.set('Add a GIPHY API key to open this vision.');
      return;
    }

    this.isGiphyLoading.set(true);
    this.giphyErrorMessage.set('');

    try {
      const response = await fetch(this.withGiphyApiKey(this.apiUrls.giphy), {
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('The GIF oracle did not answer.');
      }

      const giphyResponse = await response.json() as GiphyResponse;
      const gif = giphyResponse.data;
      await this.preloadImage(this.giphyImageUrl(gif));
      this.giphyReading.set(gif);
      this.setRevealState('giphy', true);
    } catch {
      this.giphyErrorMessage.set('The GIF oracle needs a valid GIPHY API key.');
    } finally {
      this.isGiphyLoading.set(false);
    }
  }

  async loadNumberReading(): Promise<void> {
    this.isNumberLoading.set(true);
    this.numberErrorMessage.set('');

    try {
      const number = Math.floor(Math.random() * 99999) + 1;
      const response = await fetch(this.withFreshParam(`${this.apiUrls.number}?number=${number}&from=10&to=16`), {
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('The number oracle did not answer.');
      }

      const numberResponse = await response.json() as NumberBaseResponse;
      this.numberReading.set({
        number,
        ordinal: this.toOrdinal(number),
        parity: number % 2 === 0 ? `${number} is an even number` : `${number} is an odd number`,
        binary: `${number.toString(2)}_2`,
        hexadecimal: `${numberResponse.contents.answer}_16`,
        digitSum: [...number.toString()].reduce((sum, digit) => sum + Number(digit), 0)
      });
      this.setRevealState('number', true);
    } catch {
      this.numberErrorMessage.set('The number oracle fell silent. Ask again in a moment.');
    } finally {
      this.isNumberLoading.set(false);
    }
  }

  protected emojiSymbol(emoji: EmojiReading | null): string {
    const unicodeValues = emoji?.unicode ?? [];

    if (unicodeValues.length > 0) {
      return unicodeValues
        .map((value) => String.fromCodePoint(parseInt(value.replace('U+', ''), 16)))
        .join('');
    }

    return emoji?.htmlCode[0] ?? '';
  }

  protected giphyImageUrl(gif: GiphyGif | null): string {
    return gif?.images.downsized_medium?.url
      ?? gif?.images.fixed_height?.url
      ?? gif?.images.original?.url
      ?? '';
  }

  private withFreshParam(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_=${Date.now()}`;
  }

  private toOrdinal(number: number): string {
    const tens = number % 100;

    if (tens >= 11 && tens <= 13) {
      return `${number}th`;
    }

    return `${number}${['th', 'st', 'nd', 'rd'][number % 10] ?? 'th'}`;
  }

  private withGiphyApiKey(url: string): string {
    return this.withFreshParam(`${url}?api_key=${encodeURIComponent(this.giphyApiKey())}&rating=g`);
  }

  private async fetchAllowedEmoji(): Promise<EmojiReading> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await fetch(this.withFreshParam(this.apiUrls.emoji), {
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('The glyph bowl did not answer.');
      }

      const emoji = await response.json() as EmojiReading;

      if (!this.isBlockedEmoji(emoji)) {
        return emoji;
      }
    }

    throw new Error('Only flags came through.');
  }

  private isBlockedEmoji(emoji: EmojiReading): boolean {
    const text = `${emoji.name} ${emoji.category} ${emoji.group}`.toLowerCase();
    return text.includes('flag') || text.includes('country');
  }

  private setRevealState(type: AnswerType, revealed: boolean): void {
    this.revealedAnswers.update((current) => ({
      ...current,
      [type]: revealed
    }));
  }

  private preloadImage(src: string): Promise<void> {
    if (!src) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const image = new Image();
      const finish = () => {
        clearTimeout(timeout);
        resolve();
      };
      const timeout = setTimeout(resolve, 2500);

      image.onload = finish;
      image.onerror = finish;
      image.src = src;
    });
  }
}
