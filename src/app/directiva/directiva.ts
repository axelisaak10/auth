import { Directive, Input, TemplateRef, ViewContainerRef, effect, computed } from '@angular/core';
import { PermissionService } from '../services/permission.service';
import { Permission } from '../models/types';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private permission: Permission | undefined;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService,
    private authService: AuthService,
  ) {
    effect(() => {
      const permissions = this.authService.userPermissions();
      this.updateView();
    });
  }

  @Input() set hasPermission(val: Permission) {
    this.permission = val;
    this.updateView();
  }

  private updateView() {
    if (this.permission && this.permissionService.hasPermission(this.permission)) {
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }
}
