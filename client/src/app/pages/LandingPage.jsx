import { Box } from "@mantine/core";
import { Hero, HowItWorks, Features, CallToAction, ImpactSection } from './main/landing/index'
import {HomepageFooter, HomepageHeader} from './main/common/index'


export default function LandingPage() {
  return (
    <Box>
      <HomepageHeader />
      <Box style={{ backgroundColor: "white" }}>
        <Hero />
        <Features />
        <HowItWorks />
        <ImpactSection />
        <CallToAction />
        <HomepageFooter/>
      </Box>
    </Box>
  );
}