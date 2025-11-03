import { Box } from "@mantine/core";
import { HomepageHeader, HomepageFooter } from "./main/common/index";
import { HeroSection, MainStepSection, DetailedWorkflow, OfflineFeature, UserTypes, CTA} from './main/how/index'


export default function HowItWorksPage() {
  return (
    <Box>
      <HomepageHeader />
      <Box style={{ backgroundColor: 'white' }}>
        <HeroSection />
        <MainStepSection />
        <DetailedWorkflow />
        <OfflineFeature />
        <UserTypes />
        <CTA/>
        <HomepageFooter />
      </Box>
    </Box>
  );
}