package com.clientdesk.service;

import com.clientdesk.dto.CreateServiceTypeRequest;
import com.clientdesk.dto.ServiceTypeDto;
import com.clientdesk.exception.BadRequestException;
import com.clientdesk.exception.ResourceNotFoundException;
import com.clientdesk.model.ServiceType;
import com.clientdesk.repository.ServiceTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ServiceTypeService {

    private final ServiceTypeRepository serviceTypeRepository;
    private final EventLogger eventLogger;

    public ServiceTypeService(ServiceTypeRepository serviceTypeRepository, EventLogger eventLogger) {
        this.serviceTypeRepository = serviceTypeRepository;
        this.eventLogger = eventLogger;
    }

    @Transactional(readOnly = true)
    public List<ServiceTypeDto> getAllServiceTypes(boolean activeOnly) {
        List<ServiceType> list = activeOnly ?
                serviceTypeRepository.findByActiveTrueOrderByNameAsc() :
                serviceTypeRepository.findAllByOrderByNameAsc();

        return list.stream()
                .map(ServiceTypeDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceTypeDto getById(Long id) {
        ServiceType entity = serviceTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Вид услуги не найден с id: " + id));
        return ServiceTypeDto.fromEntity(entity);
    }

    public ServiceTypeDto createServiceType(CreateServiceTypeRequest request, String initiatorLogin) {
        if (serviceTypeRepository.findByNameIgnoreCase(request.getName().trim()).isPresent()) {
            throw new BadRequestException("Вид услуги с наименованием '" + request.getName() + "' уже существует");
        }

        ServiceType entity = new ServiceType(
                request.getName().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                request.getActive() != null ? request.getActive() : true
        );

        ServiceType saved = serviceTypeRepository.save(entity);
        eventLogger.logEvent(initiatorLogin, "SERVICE_TYPE_CREATED",
                String.format("Создан вид услуги: %s (id: %d)", saved.getName(), saved.getId()));

        return ServiceTypeDto.fromEntity(saved);
    }

    public ServiceTypeDto updateServiceType(Long id, CreateServiceTypeRequest request, String initiatorLogin) {
        ServiceType entity = serviceTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Вид услуги не найден с id: " + id));

        serviceTypeRepository.findByNameIgnoreCase(request.getName().trim())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new BadRequestException("Вид услуги с наименованием '" + request.getName() + "' уже существует");
                    }
                });

        entity.setName(request.getName().trim());
        entity.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        if (request.getActive() != null) {
            entity.setActive(request.getActive());
        }

        ServiceType updated = serviceTypeRepository.save(entity);
        eventLogger.logEvent(initiatorLogin, "SERVICE_TYPE_UPDATED",
                String.format("Обновлен вид услуги: %s (id: %d, active: %b)", updated.getName(), updated.getId(), updated.isActive()));

        return ServiceTypeDto.fromEntity(updated);
    }
}
