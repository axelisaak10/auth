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
  effect,
} from '@angular/core';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit, OnChanges {
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);

  private permission: string | string[] = [];
  private isRendered = false;

  private refresh$ = new Subject<void>();

  constructor() {
    effect(() => {
      const permissions = this.authService.userPermissions();
      this.updateView();
    });
  }

  @Input()
  set appHasPermission(value: string | string[]) {
    this.permission = value;
    this.updateView();
  }

  ngOnInit(): void {
    this.authService.isLoggedIn;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['permission']) {
      this.updateView();
    }
  }

  private updateView(): void {
    if (!this.authService.isLoggedIn()) {
      this.clearView();
      return;
    }

    const hasAccess = Array.isArray(this.permission)
      ? this.permissionService.hasAnyPermission(...this.permission)
      : this.permissionService.hasPermission(this.permission);

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
