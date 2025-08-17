import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { iglooTheme, iglooStyles } from "../theme";

export function LibraryPage() {
  return (
    <Box>
      <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
        <Card 
          size="4" 
          style={{
            ...iglooStyles.card,
            textAlign: 'center',
            padding: '48px',
            maxWidth: '500px',
            background: iglooTheme.gradients.frostWhite
          }}
        >
          <Box mb="4">
            <Box
              style={{
                fontSize: '4rem',
                marginBottom: '16px',
                filter: 'drop-shadow(0 4px 8px rgba(14, 165, 233, 0.2))'
              }}
            >
              📚
            </Box>
            <Heading 
              size="7" 
              mb="3"
              style={{ 
                color: iglooTheme.colors.primary[700],
                textShadow: '0 1px 2px rgba(14, 165, 233, 0.1)'
              }}
            >
              Your Game Library
            </Heading>
            <Text 
              size="4" 
              style={{ 
                color: iglooTheme.colors.ice[600],
                lineHeight: '1.6'
              }}
            >
              Your personal collection of games will appear here
            </Text>
          </Box>
          
          <Box
            style={{
              background: iglooTheme.gradients.iceBlue,
              padding: '24px',
              borderRadius: iglooTheme.borderRadius.arch,
              border: `1px solid ${iglooTheme.colors.primary[200]}`,
              marginTop: '24px'
            }}
          >
            <Text 
              size="6" 
              weight="bold"
              style={{ 
                color: iglooTheme.colors.primary[700],
                display: 'block',
                marginBottom: '12px'
              }}
            >
              ❄️ Coming Soon!
            </Text>
            <Text 
              size="3"
              style={{ 
                color: iglooTheme.colors.ice[700],
                lineHeight: '1.5'
              }}
            >
              We're working on bringing you the perfect library experience where you can manage, organize, and play all your ColdCache games.
            </Text>
          </Box>

          <Box mt="4">
            <Text 
              size="2" 
              style={{ 
                color: iglooTheme.colors.ice[500],
                fontStyle: 'italic'
              }}
            >
              In the meantime, check out the Store to discover amazing games! 🎮
            </Text>
          </Box>
        </Card>
      </Flex>
    </Box>
  );
}
