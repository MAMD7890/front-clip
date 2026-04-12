import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  sidebarOpen = true;

  constructor() { }

  ngOnInit(): void {
    this.syncSidebarByViewport();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.syncSidebarByViewport();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  private syncSidebarByViewport(): void {
    if (window.innerWidth <= 768) {
      this.sidebarOpen = false;
    } else {
      this.sidebarOpen = true;
    }
  }
}
