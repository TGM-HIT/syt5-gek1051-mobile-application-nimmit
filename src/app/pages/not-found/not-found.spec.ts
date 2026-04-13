import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { TranslocoAppLoader } from '../../transloco/transloco-loader';

import { NotFound } from './not-found';

describe('NotFound', () => {
  let component: NotFound;
  let fixture: ComponentFixture<NotFound>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFound],
      providers: [
        provideRouter([]),
        provideTransloco({
          config: translocoConfig({
            availableLangs: ['de', 'en'],
            defaultLang: 'de',
            reRenderOnLangChange: true,
            prodMode: true,
          }),
          loader: TranslocoAppLoader,
        }),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotFound);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
