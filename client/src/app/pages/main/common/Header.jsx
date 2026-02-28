import {
  Box,
  Burger,
  Button,
  Divider,
  Drawer,
  Group,
  ScrollArea,
  Text,
  Image,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from 'react-router';
import { useState } from 'react';
import { PRIMARY_GOLD, PRIMARY_BROWN } from '../../../../utils/constants';
import classes from './Header.module.css';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/features' },
  { label: 'How it works', path: '/how' },
  { label: 'About', path: '/about' },
];

export default function HomepageHeader({ activePage }) {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [hoveredLink, setHoveredLink] = useState(null);

  return (
    <Box>
      <header className={classes.header}>
        <Group justify="space-between" h="100%">
          {/* Logo and Brand */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Group gap="xs">
              <Image
                src="/sola_logo.png"
                alt="JustReach Logo"
                w={35}
                h={35}
                fit="contain"
              />
              <Box>
                <Text span size="lg" fw={700} c={PRIMARY_GOLD} style={{ lineHeight: 1 }}>
                  SOLA -
                </Text>
                <Text span size="lg" fw={700} c={PRIMARY_BROWN} style={{ lineHeight: 1 }} ml={5}>
                    JustReach
                </Text>
              </Box>
            </Group>
          </Link>

          {/* Desktop Navigation */}
          <Group h="100%" gap={0} visibleFrom="sm">
            {navLinks.map((link) => {
              const isActive = link.label.toLowerCase() === activePage?.toLowerCase();
              const isHovered = hoveredLink === link.label;

              return (
                <Link
                  to={link.path}
                  key={link.label}
                  className={classes.link}
                  onMouseEnter={() => setHoveredLink(link.label)}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{
                    color: isActive ? PRIMARY_BROWN : isHovered ? PRIMARY_GOLD : undefined,
                    fontWeight: isActive ? 700 : 500,
                    borderBottom: isActive
                      ? `2px solid ${PRIMARY_BROWN}`
                      : isHovered
                      ? `2px solid ${PRIMARY_GOLD}`
                      : '2px solid transparent',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </Group>

          {/* Desktop Button */}
          <Group visibleFrom="sm">
            <Link to="/auth/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="gradient"
                gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                radius="xl"
                size="sm"
              >
                Get Started
              </Button>
            </Link>
          </Group>

          {/* Mobile Burger */}
          <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" color={PRIMARY_BROWN} />
        </Group>
      </header>

      {/* Mobile Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="70%"
        padding="md"
        title="Navigation"
        hiddenFrom="sm"
        zIndex={1000000}
        position="right"
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md">
          <Divider my="sm" />

          {navLinks.map((link) => {
            const isActive = link.label.toLowerCase() === activePage?.toLowerCase();

            return (
              <Link
                to={link.path}
                key={link.label}
                className={classes.link}
                onClick={closeDrawer}
                style={{
                  color: isActive ? PRIMARY_BROWN : undefined,
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? `${PRIMARY_GOLD}15` : undefined,
                  borderLeft: isActive ? `4px solid ${PRIMARY_BROWN}` : undefined,
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <Divider my="sm" />

          <Group justify="center" grow pb="xl" px="md">
            <Link to="/login" style={{ textDecoration: 'none', width: '100%' }} onClick={closeDrawer}>
              <Button
                variant="gradient"
                gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                radius="xl"
                size="md"
                fullWidth
              >
                Get Started
              </Button>
            </Link>
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
}