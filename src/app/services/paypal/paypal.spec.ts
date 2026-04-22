import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Paypal } from './paypal';

describe('Paypal', () => {
  let component: Paypal;
  let fixture: ComponentFixture<Paypal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Paypal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Paypal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
