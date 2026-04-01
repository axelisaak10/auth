import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  inject,
  DestroyRef,
} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive({
  selector: '[appIsSuperAdmin]',
  standalone: true,
})
export class IsSuperAdminDirective implements OnInit {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);

  private isRendered = false;

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const isLoggedIn = this.authService.isLoggedIn();
    const isSuperAdmin = this.authService.isSuperAdmin();

    if (isLoggedIn && isSuperAdmin && !this.isRendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isRendered = true;
    } else if ((!isLoggedIn || !isSuperAdmin) && this.isRendered) {
      this.viewContainer.clear();
      this.isRendered = false;
    }
  }
}
