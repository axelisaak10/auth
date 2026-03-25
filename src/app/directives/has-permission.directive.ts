import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { PermissionService, Permission } from '../services/permission.service';

@Directive({
    selector: '[appHasPermission]',
})
export class HasPermissionDirective implements OnInit {
    private permission: Permission | Permission[] = [];
    private isRendered = false;

    @Input()
    set appHasPermission(value: Permission | Permission[]) {
        this.permission = value;
        this.updateView();
    }

    constructor(
        private templateRef: TemplateRef<unknown>,
        private viewContainer: ViewContainerRef,
        private permissionService: PermissionService,
    ) { }

    ngOnInit(): void {
        this.updateView();
    }

    private updateView(): void {
        const hasAccess = Array.isArray(this.permission)
            ? this.permissionService.hasAnyPermission(...this.permission)
            : this.permissionService.hasPermission(this.permission);

        if (hasAccess && !this.isRendered) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.isRendered = true;
        } else if (!hasAccess && this.isRendered) {
            this.viewContainer.clear();
            this.isRendered = false;
        }
    }
}
