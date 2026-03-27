import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppError } from './app-error';

describe('AppError', () => {
  let component: AppError;
  let fixture: ComponentFixture<AppError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppError]
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
