import { Quantum } from 'ldrs/react';
import 'ldrs/react/Quantum.css';
import { Box } from '@mantine/core';

/**
 * A reusable, themed loader component for the application.
 * @param {object} props
 * @param {string} [props.size="45"] - The size of the loader.
 * @param {string} [props.speed="1.75"] - The speed of the loader animation.
 * @param {string} [props.color="#7E30E1"] - The color of the loader.
 * @param {number} [props.height=300] - The height of the container.
 */
export function Loaders({ size = "45", speed = "1.75", color = "#7E30E1", height = 300 }) {
  return (
    <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: `${height}px` }}>
      <Quantum
        size={size}
        speed={speed}
        color={color}
      />
    </Box>
  );
}