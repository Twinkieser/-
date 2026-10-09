package com.clientdesk.service;

import com.clientdesk.dto.ClientDto;
import com.clientdesk.dto.CreateClientRequest;
import com.clientdesk.dto.TicketDto;
import com.clientdesk.exception.ResourceNotFoundException;
import com.clientdesk.model.Client;
import com.clientdesk.repository.ClientRepository;
import com.clientdesk.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;
    private final TicketRepository ticketRepository;
    private final EventLogger eventLogger;

    public ClientService(ClientRepository clientRepository,
                         TicketRepository ticketRepository,
                         EventLogger eventLogger) {
        this.clientRepository = clientRepository;
        this.ticketRepository = ticketRepository;
        this.eventLogger = eventLogger;
    }

    @Transactional(readOnly = true)
    public List<ClientDto> getAllClients(String search) {
        List<Client> clients;
        if (search != null && !search.trim().isEmpty()) {
            clients = clientRepository.searchClients(search.trim());
        } else {
            clients = clientRepository.findAllByOrderByNameAsc();
        }

        return clients.stream()
                .map(client -> {
                    long count = ticketRepository.findByClientIdOrderByCreatedAtDesc(client.getId()).size();
                    return ClientDto.fromEntity(client, count);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientDto getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Клиент не найден с id: " + id));
        long count = ticketRepository.findByClientIdOrderByCreatedAtDesc(client.getId()).size();
        return ClientDto.fromEntity(client, count);
    }

    @Transactional(readOnly = true)
    public List<TicketDto> getClientTickets(Long clientId) {
        if (!clientRepository.existsById(clientId)) {
            throw new ResourceNotFoundException("Клиент не найден с id: " + clientId);
        }
        return ticketRepository.findByClientIdOrderByCreatedAtDesc(clientId).stream()
                .map(t -> TicketDto.fromEntity(t, false))
                .toList();
    }

    public ClientDto createClient(CreateClientRequest request, String initiatorLogin) {
        Client client = new Client(
                request.getName().trim(),
                request.getContactPerson() != null ? request.getContactPerson().trim() : null,
                request.getPhone() != null ? request.getPhone().trim() : null,
                request.getEmail() != null ? request.getEmail().trim() : null,
                request.getNote() != null ? request.getNote().trim() : null
        );

        Client saved = clientRepository.save(client);
        eventLogger.logEvent(initiatorLogin, "CLIENT_CREATED",
                String.format("Создан клиент: %s (id: %d)", saved.getName(), saved.getId()));

        return ClientDto.fromEntity(saved, 0);
    }

    public ClientDto updateClient(Long id, CreateClientRequest request, String initiatorLogin) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Клиент не найден с id: " + id));

        client.setName(request.getName().trim());
        client.setContactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null);
        client.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        client.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        client.setNote(request.getNote() != null ? request.getNote().trim() : null);

        Client updated = clientRepository.save(client);
        long count = ticketRepository.findByClientIdOrderByCreatedAtDesc(client.getId()).size();

        eventLogger.logEvent(initiatorLogin, "CLIENT_UPDATED",
                String.format("Обновлен клиент: %s (id: %d)", updated.getName(), updated.getId()));

        return ClientDto.fromEntity(updated, count);
    }
}
