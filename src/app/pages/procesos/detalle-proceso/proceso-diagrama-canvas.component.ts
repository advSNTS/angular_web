import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { ArcoResponse } from '../../../models/proceso';
import { DiagramaNodoCanvas, DiagramaNodoMovimiento } from './detalle-proceso-diagrama.types';

interface DragSession {
  nodeId: number;
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

interface CanvasSize {
  width: number;
  height: number;
}

@Component({
  selector: 'app-proceso-diagrama-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proceso-diagrama-canvas.component.html',
  styleUrl: './proceso-diagrama-canvas.component.css'
})
export class ProcesoDiagramaCanvasComponent {
  @Input({ required: true }) nodes: DiagramaNodoCanvas[] = [];
  @Input() arcos: ArcoResponse[] = [];
  @Input() editable = false;

  @Output() nodeMoveEnd = new EventEmitter<DiagramaNodoMovimiento>();

  @ViewChild('board', { static: true }) boardRef!: ElementRef<HTMLDivElement>;

  draggingNodeId: number | null = null;
  private dragSession: DragSession | null = null;
  get canvasWidth(): number {
    return this.getCanvasSize().width;
  }

  get canvasHeight(): number {
    return this.getCanvasSize().height;
  }

  trackByNodeId(_: number, node: DiagramaNodoCanvas): number {
    return node.id;
  }

  trackByArcId(_: number, arc: ArcoResponse): number {
    return arc.id;
  }

  onNodePointerDown(node: DiagramaNodoCanvas, event: PointerEvent): void {
    if (!this.editable) {
      return;
    }

    const board = this.boardRef?.nativeElement;
    if (!board) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement | null;
    target?.setPointerCapture(event.pointerId);

    this.draggingNodeId = node.id;
    this.dragSession = {
      nodeId: node.id,
      pointerId: event.pointerId,
      offsetX: event.clientX - this.getBoardRect().left - node.x,
      offsetY: event.clientY - this.getBoardRect().top - node.y
    };
  }

  @HostListener('window:pointermove', ['$event'])
  onWindowPointerMove(event: PointerEvent): void {
    if (!this.dragSession || event.pointerId !== this.dragSession.pointerId || !this.editable) {
      return;
    }

    const node = this.findNode(this.dragSession.nodeId);
    if (!node) {
      return;
    }

    const next = this.normalizePosition(
      event.clientX - this.getBoardRect().left - this.dragSession.offsetX,
      event.clientY - this.getBoardRect().top - this.dragSession.offsetY,
      node
    );

    node.x = next.x;
    node.y = next.y;
  }

  @HostListener('window:pointerup', ['$event'])
  onWindowPointerUp(event: PointerEvent): void {
    if (!this.dragSession || event.pointerId !== this.dragSession.pointerId) {
      return;
    }

    const node = this.findNode(this.dragSession.nodeId);
    if (node) {
      const finalPosition = this.normalizePosition(node.x, node.y, node);
      node.x = finalPosition.x;
      node.y = finalPosition.y;
      this.nodeMoveEnd.emit({ id: node.id, x: node.x, y: node.y });
    }

    this.dragSession = null;
    this.draggingNodeId = null;
  }

  @HostListener('window:pointercancel', ['$event'])
  onWindowPointerCancel(event: PointerEvent): void {
    this.onWindowPointerUp(event);
  }

  buildArcPath(arc: ArcoResponse): string | null {
    const origin = this.findNode(arc.nodoOrigenId);
    const destination = this.findNode(arc.nodoDestinoId);
    if (!origin || !destination) {
      return null;
    }

    const from = this.getNodeCenter(origin);
    const to = this.getNodeCenter(destination);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    const ux = dx / distance;
    const uy = dy / distance;

    const startX = from.x + ux * (origin.width / 2);
    const startY = from.y + uy * (origin.height / 2);
    const endX = to.x - ux * (destination.width / 2);
    const endY = to.y - uy * (destination.height / 2);

    return `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  }

  private findNode(nodeId: number): DiagramaNodoCanvas | undefined {
    return this.nodes.find((node) => node.id === nodeId);
  }

  private getNodeCenter(node: DiagramaNodoCanvas): { x: number; y: number } {
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2
    };
  }

  private getBoardRect(): DOMRect {
    return this.boardRef.nativeElement.getBoundingClientRect();
  }

  private getCanvasSize(): CanvasSize {
    const minWidth = 1120;
    const minHeight = 720;
    const padding = 160;

    const maxRight = this.nodes.reduce((acc, node) => Math.max(acc, node.x + node.width), 0);
    const maxBottom = this.nodes.reduce((acc, node) => Math.max(acc, node.y + node.height), 0);

    return {
      width: Math.max(minWidth, maxRight + padding),
      height: Math.max(minHeight, maxBottom + padding)
    };
  }

  private normalizePosition(x: number, y: number, node: DiagramaNodoCanvas): { x: number; y: number } {
    const bounds = this.getCanvasSize();
    const maxX = Math.max(bounds.width - node.width, 0);
    const maxY = Math.max(bounds.height - node.height, 0);

    const safeX = Number.isFinite(x) ? x : 0;
    const safeY = Number.isFinite(y) ? y : 0;

    return {
      x: Math.max(0, Math.min(maxX, Math.round(safeX))),
      y: Math.max(0, Math.min(maxY, Math.round(safeY)))
    };
  }
}
