import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Offline } from './offline';

describe('Offline', () => {
  let component: Offline;
  let fixture: ComponentFixture<Offline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Offline],
      providers: [provideRouter([])]
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
