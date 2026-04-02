package com.parkingapp.service;

import com.parkingapp.domain.Payment;
import com.parkingapp.domain.PaymentStatus;
import com.parkingapp.domain.Ticket;
import com.parkingapp.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Currency;

@Service
public class PaymentService {

    private PaymentRepository paymentRepository;
    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public Payment processPayment(Ticket ticket, Double amount, String currency) {

        Payment payment = new Payment();
        payment.setTicket(ticket);
        payment.setAmount(amount);
        payment.setCurrency(currency);
        payment.setProcessedAt(LocalDateTime.now());

        boolean paymentSuccessful = mockPaymentGatewayCall(amount,currency);

        if (paymentSuccessful) {
            payment.setPaymentStatus(PaymentStatus.ACCEPTED);
        } else {
            payment.setPaymentStatus(PaymentStatus.DECLINED);
        }

        return paymentRepository.save(payment);
    }

    private boolean mockPaymentGatewayCall(double amount,String currency) {
        System.out.println("Processing payment: " + amount + "..." + currency);
        return true;
    }

}
