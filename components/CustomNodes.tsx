import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Square Node
export const SquareNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '8px',
        background: data.color || '#9333ea',
        color: 'white',
        border: selected ? '2px solid #fff' : '2px solid transparent',
        boxShadow: selected ? '0 0 0 2px #9333ea' : 'none',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: 500,
      }}
    >
      <Handle type="target" position={Position.Top} />
      {data.label}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

SquareNode.displayName = 'SquareNode';

// Circle Node
export const CircleNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: data.color || '#3b82f6',
        color: 'white',
        border: selected ? '2px solid #fff' : '2px solid transparent',
        boxShadow: selected ? '0 0 0 2px #3b82f6' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: 500,
        padding: '10px',
      }}
    >
      <Handle type="target" position={Position.Top} />
      {data.label}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

CircleNode.displayName = 'CircleNode';

// Diamond Node
export const DiamondNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div style={{ position: 'relative', width: '120px', height: '120px' }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          background: data.color || '#10b981',
          transform: 'rotate(45deg)',
          border: selected ? '2px solid #fff' : '2px solid transparent',
          boxShadow: selected ? '0 0 0 2px #10b981' : 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontWeight: 500,
          textAlign: 'center',
          width: '80%',
        }}
      >
        {data.label}
      </div>
      <Handle type="target" position={Position.Top} style={{ top: '-5px' }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: '-5px' }} />
    </div>
  );
});

DiamondNode.displayName = 'DiamondNode';

// Triangle Node
export const TriangleNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div style={{ position: 'relative', width: '120px', height: '120px' }}>
      <svg width="120" height="120" style={{ overflow: 'visible' }}>
        <polygon
          points="60,10 110,100 10,100"
          fill={data.color || '#f59e0b'}
          stroke={selected ? '#fff' : 'transparent'}
          strokeWidth={selected ? '2' : '0'}
          style={{
            filter: selected ? 'drop-shadow(0 0 4px #f59e0b)' : 'none',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontWeight: 500,
          textAlign: 'center',
          width: '80%',
        }}
      >
        {data.label}
      </div>
      <Handle type="target" position={Position.Top} style={{ top: '5px' }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: '15px' }} />
    </div>
  );
});

TriangleNode.displayName = 'TriangleNode';

// Hexagon Node
export const HexagonNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div style={{ position: 'relative', width: '120px', height: '120px' }}>
      <svg width="120" height="120" style={{ overflow: 'visible' }}>
        <polygon
          points="60,5 105,32.5 105,87.5 60,115 15,87.5 15,32.5"
          fill={data.color || '#ef4444'}
          stroke={selected ? '#fff' : 'transparent'}
          strokeWidth={selected ? '2' : '0'}
          style={{
            filter: selected ? 'drop-shadow(0 0 4px #ef4444)' : 'none',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontWeight: 500,
          textAlign: 'center',
          width: '70%',
        }}
      >
        {data.label}
      </div>
      <Handle type="target" position={Position.Top} style={{ top: '0px' }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: '0px' }} />
    </div>
  );
});

HexagonNode.displayName = 'HexagonNode';

// Cylinder Node (Database)
export const CylinderNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div style={{ position: 'relative', width: '100px', height: '120px' }}>
      <svg width="100" height="120" style={{ overflow: 'visible' }}>
        <ellipse
          cx="50"
          cy="15"
          rx="45"
          ry="15"
          fill={data.color || '#8b5cf6'}
          stroke={selected ? '#fff' : 'transparent'}
          strokeWidth={selected ? '2' : '0'}
        />
        <rect
          x="5"
          y="15"
          width="90"
          height="90"
          fill={data.color || '#8b5cf6'}
          stroke={selected ? '#fff' : 'transparent'}
          strokeWidth={selected ? '2' : '0'}
        />
        <ellipse
          cx="50"
          cy="105"
          rx="45"
          ry="15"
          fill={data.color || '#8b5cf6'}
          stroke={selected ? '#fff' : 'transparent'}
          strokeWidth={selected ? '2' : '0'}
          style={{
            filter: selected ? 'drop-shadow(0 0 4px #8b5cf6)' : 'none',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontWeight: 500,
          textAlign: 'center',
          width: '80%',
        }}
      >
        {data.label}
      </div>
      <Handle type="target" position={Position.Top} style={{ top: '10px' }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: '10px' }} />
    </div>
  );
});

CylinderNode.displayName = 'CylinderNode';
