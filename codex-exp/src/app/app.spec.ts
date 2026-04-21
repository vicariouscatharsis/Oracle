import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { App } from './app';

describe('App', () => {
  const mockFact = {
    id: 'test-fact',
    text: 'Bananas are berries, but strawberries are not.',
    source: 'djtech.net',
    source_url: 'https://example.com/source',
    language: 'en',
    permalink: 'https://example.com/fact'
  };
  const mockAdvice = {
    slip: {
      id: 77,
      advice: 'Never test the depth of the water with both feet.'
    }
  };
  const mockYesNoAnswer = {
    answer: 'yes',
    forced: false,
    image: 'https://yesno.wtf/assets/yes/1.gif'
  };
  const mockEmojiReading = {
    name: 'crystal ball',
    category: 'objects',
    group: 'objects',
    htmlCode: ['&#128302;'],
    unicode: ['U+1F52E']
  };
  const blockedEmojiReading = {
    name: 'flag: france',
    category: 'flags',
    group: 'flags',
    htmlCode: ['&#127467;&#127479;'],
    unicode: ['U+1F1EB', 'U+1F1F7']
  };
  const mockCardResponse = {
    success: true,
    deck_id: 'test-deck',
    cards: [{
      code: 'AS',
      image: 'https://deckofcardsapi.com/static/img/AS.png',
      value: 'ACE',
      suit: 'SPADES'
    }],
    remaining: 51
  };
  const mockGiphyResponse = {
    data: {
      id: 'abc123',
      title: 'Mystic cat GIF',
      url: 'https://giphy.com/gifs/abc123',
      images: {
        downsized_medium: {
          url: 'https://media.giphy.com/media/abc123/giphy.gif'
        }
      }
    }
  };
  const mockNumberResponse = {
    contents: {
      answer: '2A'
    }
  };

  beforeEach(async () => {
    localStorage.clear();

    vi.stubGlobal('Image', class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    });

    vi.spyOn(window, 'fetch').mockImplementation((input) => {
      const url = input.toString();
      const body = url.includes('yesno')
        ? mockYesNoAnswer
        : url.includes('deckofcardsapi')
          ? mockCardResponse
          : url.includes('giphy')
            ? mockGiphyResponse
            : url.includes('api.math.tools')
              ? mockNumberResponse
              : url.includes('emojihub')
                ? mockEmojiReading
                : url.includes('adviceslip')
                  ? mockAdvice
                  : mockFact;

      return Promise.resolve(new Response(JSON.stringify(body), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 200
      }));
    });

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start on the yes/no answer type with a placeholder', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.eyebrow')?.textContent).toContain('The Pendulum Gate');
    expect(compiled.querySelector('.answer-placeholder')).not.toBeNull();
    expect(compiled.querySelector('.placeholder-label')?.textContent).toContain('Reveal');
    expect(compiled.querySelectorAll('.type-button').length).toBe(7);
  });

  it('should switch answer types from the picker', () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.selectAnswerType('card');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.eyebrow')?.textContent).toContain('The Card Oracle');
    expect(compiled.querySelector('.type-button.is-active')?.textContent).toContain('Card');
    expect(compiled.querySelector('.answer-placeholder')).not.toBeNull();
  });

  it('should render a random fact', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.selectAnswerType('fact');
    await fixture.componentInstance.loadFact();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.api-text')?.textContent).toContain(mockFact.text);
    expect(compiled.querySelector('.action-button')?.textContent).toContain('Draw a fact');
  });

  it('should render advice from Advice Slip', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.selectAnswerType('advice');
    await fixture.componentInstance.loadAdvice();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.api-text')?.textContent).toContain(mockAdvice.slip.advice);
    expect(compiled.querySelector('.action-button')?.textContent).toContain('Consult the crystal');
  });

  it('should render a yes or no answer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.loadYesNoAnswer();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.yes-no-answer')?.textContent).toContain(mockYesNoAnswer.answer);
    expect(compiled.querySelector('.yes-no-image')?.getAttribute('src')).toBe(mockYesNoAnswer.image);
  });

  it('should render a random emoji glyph', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.selectAnswerType('emoji');
    await fixture.componentInstance.loadEmojiReading();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.emoji-symbol')?.textContent).toContain('🔮');
  });

  it('should skip blocked flag and country emojis', async () => {
    vi.mocked(window.fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify(blockedEmojiReading), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(mockEmojiReading), { status: 200 }));

    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.selectAnswerType('emoji');
    await fixture.componentInstance.loadEmojiReading();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.emoji-symbol')?.textContent).toContain('🔮');
    expect(compiled.textContent).not.toContain('flag: france');
  });

  it('should render a random card in its own image element', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.selectAnswerType('card');
    await fixture.componentInstance.loadCardReading();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.card-image')?.getAttribute('src')).toBe(mockCardResponse.cards[0].image);
  });

  it('should render a random GIPHY GIF with the default API key', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.selectAnswerType('giphy');
    await fixture.componentInstance.loadGiphyReading();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.giphy-image')?.getAttribute('src')).toBe(mockGiphyResponse.data.images.downsized_medium.url);
  });

  it('should render a random number reading', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(41 / 99999);
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.selectAnswerType('number');
    await fixture.componentInstance.loadNumberReading();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.number-symbol')?.textContent).toContain('42');
  });

  it('should hide a previously loaded answer after switching tabs', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.loadYesNoAnswer();
    fixture.detectChanges();

    fixture.componentInstance.selectAnswerType('card');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.card-image')).toBeNull();
    expect(compiled.querySelector('.answer-placeholder')).not.toBeNull();
    expect(compiled.querySelector('.placeholder-label')?.textContent).toContain('Reveal');
  });
});
