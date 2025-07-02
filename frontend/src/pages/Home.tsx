import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  Text,
  Card,
  CardBody,
  Input,
  FormControl,
  FormLabel,
  HStack,
  Divider,
  Flex,
} from '@chakra-ui/react';
import { FaPlus, FaUsers } from 'react-icons/fa';
import Lottie from 'lottie-react';
import axios from 'axios';
import { useToast } from '../utils/toast';

// Import animations
import pokerAnimation from '../assets/animations/cards-animation.json';

// Theme constants
const theme = {
  colors: {
    primary: {
      500: '#2B4D46',
      600: '#234239',
    },
    secondary: {
      100: '#F7FAFC',
      500: '#718096',
    }
  }
};

function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState(localStorage.getItem('username') || '');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleJoinRoom = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!roomCode.trim() || !playerName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both room code and your name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/rooms/code/${roomCode.toUpperCase()}`);
      localStorage.setItem('username', playerName);
      localStorage.setItem('roomCode', roomCode.toUpperCase());
      navigate(`/room/${roomCode.toUpperCase()}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Room not found or invalid code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      bg={theme.colors.secondary[100]}
      position="relative"
      overflow="hidden"
    >
      {/* Background animations */}
      <Box
        position="absolute"
        top="5%"
        left="-10%"
        width="300px"
        opacity={0.6}
        transform="rotate(-15deg)"
      >
        <Lottie animationData={pokerAnimation} loop={true} />
      </Box>
      <Box
        position="absolute"
        bottom="5%"
        right="-10%"
        width="300px"
        opacity={0.6}
        transform="rotate(15deg)"
      >
        <Lottie animationData={pokerAnimation} loop={true} />
      </Box>

      <Container maxW="container.xl" py={12} position="relative">
        <VStack spacing={8} align="stretch">
          <Card 
            boxShadow="lg" 
            bg="white"
            borderRadius="xl"
            overflow="hidden"
          >
            <CardBody>
              <VStack spacing={8} align="center">
                <Heading 
                  size="xl" 
                  color={theme.colors.primary[500]}
                  textAlign="center"
                  bgGradient={`linear(to-r, ${theme.colors.primary[500]}, ${theme.colors.primary[600]})`}
                  bgClip="text"
                  letterSpacing="tight"
                >
                  Welcome to Planning Sprint
                </Heading>
                <Text 
                  color={theme.colors.secondary[500]} 
                  fontSize="lg"
                  textAlign="center"
                  maxW="md"
                >
                  Estimate your project tasks efficiently with your team using our simple and intuitive planning tool.
                </Text>

                <Divider />

                <VStack spacing={6} width="full" maxW="md">
                  <Button
                    size="lg"
                    height="16"
                    bg={theme.colors.primary[500]}
                    color="white"
                    width="full"
                    leftIcon={<FaPlus />}
                    onClick={() => navigate('/create')}
                    _hover={{
                      bg: theme.colors.primary[600],
                      transform: 'translateY(-2px)',
                    }}
                    transition="all 0.2s"
                  >
                    Create New Room
                  </Button>

                  <Text color={theme.colors.secondary[500]}>or join an existing room</Text>

                  <Card 
                    variant="outline" 
                    width="full"
                    borderColor={theme.colors.primary[500]}
                    bg={theme.colors.secondary[100]}
                    transition="all 0.2s"
                    _hover={{
                      boxShadow: 'md',
                      transform: 'translateY(-2px)',
                    }}
                  >
                    <CardBody>
                      <Box as="form" onSubmit={handleJoinRoom}>
                        <VStack spacing={4}>
                          <FormControl isRequired>
                            <FormLabel color={theme.colors.primary[500]}>Your Name</FormLabel>
                            <Input
                              value={playerName}
                              onChange={(e) => setPlayerName(e.target.value)}
                              placeholder="Enter your name"
                              bg="white"
                              borderColor={theme.colors.primary[500]}
                              _focus={{
                                borderColor: theme.colors.primary[600],
                                boxShadow: `0 0 0 1px ${theme.colors.primary[500]}`
                              }}
                              _hover={{
                                borderColor: theme.colors.primary[600],
                              }}
                            />
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel color={theme.colors.primary[500]}>Room Code</FormLabel>
                            <Input
                              value={roomCode}
                              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                              placeholder="Enter room code"
                              bg="white"
                              maxLength={6}
                              textTransform="uppercase"
                              borderColor={theme.colors.primary[500]}
                              _focus={{
                                borderColor: theme.colors.primary[600],
                                boxShadow: `0 0 0 1px ${theme.colors.primary[500]}`
                              }}
                              _hover={{
                                borderColor: theme.colors.primary[600],
                              }}
                            />
                          </FormControl>

                          <Button
                            type="submit"
                            width="full"
                            leftIcon={<FaUsers />}
                            isLoading={isLoading}
                            isDisabled={!roomCode.trim() || !playerName.trim()}
                            variant="outline"
                            borderColor={theme.colors.primary[500]}
                            color={theme.colors.primary[500]}
                            _hover={{
                              bg: theme.colors.primary[500],
                              color: 'white',
                              transform: 'translateY(-2px)',
                            }}
                            transition="all 0.2s"
                          >
                            Join Room
                          </Button>
                        </VStack>
                      </Box>
                    </CardBody>
                  </Card>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

export default Home; 