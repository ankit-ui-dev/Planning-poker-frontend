import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
  VStack,
  Card,
  CardBody,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { useToast } from '../utils/toast';

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

// Default sequence options
const DEFAULT_SEQUENCE = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'];
const CUSTOM_SEQUENCE = ['0', '1', '2', '3', '5', '8', '13', '?'];

function CreateRoom() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [playerName, setPlayerName] = useState(localStorage.getItem('username') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<string[]>(DEFAULT_SEQUENCE);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/rooms', {
        name,
        description,
        playerName,
        sequence: selectedSequence
      });
      
      // Save username and room ID in localStorage
      localStorage.setItem('username', playerName);
      localStorage.setItem('roomId', response.data.room.id);
      localStorage.setItem('roomCode', response.data.room.room_code);
      
      // Show room code in toast before navigation
      toast({
        title: 'Room Created',
        description: `Your room code is: ${response.data.room.room_code}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate using room code instead of ID
      navigate(`/room/${response.data.room.room_code}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create room',
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
      <Container maxW="container.md" py={8}>
        <Card boxShadow="lg">
          <CardBody>
            <VStack spacing={8} align="stretch">
              <Heading color={theme.colors.primary[500]}>Create New Planning Sprint Room</Heading>
              <Box as="form" onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch">
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
                    <FormLabel color={theme.colors.primary[500]}>Room Name</FormLabel>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter room name"
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
                  <FormControl>
                    <FormLabel color={theme.colors.primary[500]}>Description</FormLabel>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter room description"
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

                  <FormControl>
                    <FormLabel color={theme.colors.primary[500]}>Select Sequence</FormLabel>
                    <VStack 
                      align="stretch" 
                      spacing={4} 
                      bg={theme.colors.secondary[100]} 
                      p={4} 
                      borderRadius="lg"
                    >
                      <Button
                        size="md"
                        bg={selectedSequence === DEFAULT_SEQUENCE ? theme.colors.primary[500] : 'white'}
                        color={selectedSequence === DEFAULT_SEQUENCE ? 'white' : theme.colors.primary[500]}
                        onClick={() => setSelectedSequence(DEFAULT_SEQUENCE)}
                        borderWidth="2px"
                        borderColor={theme.colors.primary[500]}
                        _hover={{
                          bg: theme.colors.primary[500],
                          color: 'white'
                        }}
                      >
                        Default Sequence
                        <Text fontSize="sm" ml={2} opacity={0.8}>
                          (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?)
                        </Text>
                      </Button>
                      <Button
                        size="md"
                        bg={selectedSequence === CUSTOM_SEQUENCE ? theme.colors.primary[500] : 'white'}
                        color={selectedSequence === CUSTOM_SEQUENCE ? 'white' : theme.colors.primary[500]}
                        onClick={() => setSelectedSequence(CUSTOM_SEQUENCE)}
                        borderWidth="2px"
                        borderColor={theme.colors.primary[500]}
                        _hover={{
                          bg: theme.colors.primary[500],
                          color: 'white'
                        }}
                      >
                        Custom Sequence
                        <Text fontSize="sm" ml={2} opacity={0.8}>
                          (0, 1, 2, 3, 5, 8, 13, ?)
                        </Text>
                      </Button>
                    </VStack>
                  </FormControl>

                  <Button 
                    type="submit" 
                    bg={theme.colors.primary[500]}
                    color="white"
                    size="lg"
                    isDisabled={!name.trim() || !playerName.trim()}
                    isLoading={isLoading}
                    _hover={{
                      bg: theme.colors.primary[600],
                      transform: 'translateY(-2px)',
                    }}
                    transition="all 0.2s"
                  >
                    Create Room
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}

export default CreateRoom; 