import React from 'react';
import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

/**
 * A reusable search input component.
 * It is a "controlled component," meaning its state is managed by the parent.
 * @param {object} props
 * @param {string} props.value - The current value of the search input.
 * @param {function(React.ChangeEvent<HTMLInputElement>): void} props.onChange - The function to call when the input value changes.
 */
export default function UserSearchFilter({ value, onChange }) {
  return (
    <TextInput
      placeholder="Search profiles by name, role, or email..."
      leftSection={<IconSearch size={18} stroke={1.5} />}
      value={value}
      onChange={onChange}
      w={300}
      radius="md"
      size="sm"
    />
  );
}
