import { Box } from "@mantine/core";

import {
  HomepageHeader,
  HomepageFooter,
} from './main/common/index';

import {
  Hero,
  SOLASection,
  MissionVision,
  ProjectBackground,
  TeamSection,
  InstitutionSection,
  CTA
} from './main/about/index';


export default function AboutPage() {
  return (
    <Box>
      {/* Use the common Header, passing the active page prop */}
      <HomepageHeader activePage="About" />

      <Box style={{ backgroundColor: "white" }}>
        <Hero />
        <SOLASection />
        <MissionVision/>
        <ProjectBackground />
        <TeamSection />
        <InstitutionSection />
        <CTA/>
        
        {/* Use the common Footer */}
        <HomepageFooter />
      </Box>
    </Box>
  );
}
