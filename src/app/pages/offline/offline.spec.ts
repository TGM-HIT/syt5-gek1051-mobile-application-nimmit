import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { TranslocoAppLoader } from '../../transloco/transloco-loader';
import { Offline } from './offline';

describe('Offline', () => {
  let component: Offline;
  let fixture: ComponentFixture<Offline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Offline],
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

    fixture = TestBed.createComponent(Offline);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
