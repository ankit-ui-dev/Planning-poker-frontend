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
  VStack,
  useToast,
  Card,
  CardBody,
} from '@chakra-ui/react';
import axios from 'axios';

function JoinRoom() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState(localStorage.getItem('username') || '');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // First, get the room by code
      const response = await axios.get(`http://localhost:3001/api/rooms/code/${roomCode.toUpperCase()}`);
      const roomId = response.data.id;
      
      // Save username in localStorage
      localStorage.setItem('username', playerName);
      localStorage.setItem('roomId', roomId.toString());
      
      // Navigate to the room
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
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
    <Container maxW="container.md" py={8}>
      <Card>
        <CardBody>
          <VStack spacing={8} align="stretch">
            <Heading size="lg">Join Sprint Planning Room</Heading>
            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Your Name</FormLabel>
                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Room Code</FormLabel>
                  <Input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="Enter room code"
                    maxLength={6}
                    textTransform="uppercase"
                  />
                </FormControl>
                <Button 
                  type="submit" 
                  colorScheme="brand"
                  isDisabled={!roomCode.trim() || !playerName.trim()}
                  isLoading={isLoading}
                >
                  Join Room
                </Button>
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
}

export default JoinRoom; 