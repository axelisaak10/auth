import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  DestroyRef,
} from '@angular/core';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

@Directive({
  selector: '[appHasAnyPermission]',
  standalone: true,
})
export class HasAnyPermissionDirective implements OnInit, OnChanges {
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);

  private permissions: string[] = [];
  private isRendered = false;

  private refresh$ = new Subject<void>();

  @Input()
  set appHasAnyPermission(value: string | string[]) {
    if (typeof value === 'string') {
      this.permissions = value.split(',').map((p) => p.trim());
    } else if (Array.isArray(value)) {
      this.permissions = value;
    } else {
      this.permissions = [];
    }
    this.updateView();
  }

  ngOnInit(): void {
    this.refresh$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateView();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['permissions']) {
      this.updateView();
    }
  }

  private updateView(): void {
    if (!this.authService.isLoggedIn()) {
      this.clearView();
      return;
    }

    const hasAccess = this.permissionService.hasAnyPermission(...this.permissions);

    if (hasAccess && !this.isRendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isRendered = true;
    } else if (!hasAccess && this.isRendered) {
      this.clearView();
    }
  }

  private clearView(): void {
    this.viewContainer.clear();
    this.isRendered = false;
  }
}
