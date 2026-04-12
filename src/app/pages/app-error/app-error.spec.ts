import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { TranslocoAppLoader } from '../../transloco/transloco-loader';

import { AppError } from './app-error';

describe('AppError', () => {
  let component: AppError;
  let fixture: ComponentFixture<AppError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppError],
      providers: [
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

    fixture = TestBed.createComponent(AppError);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
